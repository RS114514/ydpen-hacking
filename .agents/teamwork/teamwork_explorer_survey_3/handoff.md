# Half-Life 原生小应用 NPC 姿态、生命周期管理与自动化测试勘测交付报告 (handoff.md)

## 1. Observation（观测事实与代码证据）

### 1.1 NPC 姿态机制与模型资源定义
1. **模型与骨骼文件**：
   - 检查 `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/models/scientist.mdl`：
     - 骨骼数：22 根。根骨骼为 `Bone 0 (Bip02)`，`parent = -1`，未分配任何 Bone Controller。
     - 控制器：Controller 0 绑定骨骼 20（`Bip02 Head`，`STUDIO_XR`，范围 $[-60^\circ, 60^\circ]$）；Controller 1 绑定骨骼 21（`Bone01` 嘴部开合，`STUDIO_ZR`，范围 $[0^\circ, 20^\circ]$）。
   - 检查 `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/models/barney.mdl`：
     - 骨骼数：24 根。根骨骼为 `Bone 0 (Bip01)`，`parent = -1`。
     - 控制器：Controller 0 绑定骨骼 21（头部）；Controller 1 绑定骨骼 22（嘴部）。
   - 检查 `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/maps/c1a0.bsp`：
     - 地图实体参数仅指定偏航角 `"angle" "180"`，初始摆放无俯仰倾角。
2. **客户端与服务端源码修改记录**：
   - 检查 `/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/cl_dll/StudioModelRenderer.cpp`：
     - 第 466-468 行：`angles[ROLL] = m_pCurrentEntity->curstate.angles[ROLL]; angles[PITCH] = m_pCurrentEntity->curstate.angles[PITCH]; angles[YAW] = m_pCurrentEntity->curstate.angles[YAW];`
     - 第 538-554 行：在 `StudioSetUpTransform` 阶段，对 `curstate.movetype == MOVETYPE_STEP` 或匹配 `scientist`、`barney`、`gman`、`hgrunt`、`zombie`、`player`、`holo`、`construction`、`hassassin`、`islave`、`otis` 模型名称的人形怪物，强制执行 `angles[PITCH] = 0.0f; angles[ROLL] = 0.0f;`。
     - 第 559 行：`AngleMatrix( angles, ( *m_protationmatrix ) );`
   - 检查 `/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/dlls/monsters.cpp`：
     - 第 2000-2004 行（`MonsterInit`）：`if( pev->movetype == MOVETYPE_STEP ) { pev->angles.x = 0.0f; pev->angles.z = 0.0f; }`
     - 第 2557-2561 行（`ChangeYaw`）：`pev->angles.y = UTIL_AngleMod( current + move ); if( pev->movetype == MOVETYPE_STEP ) { pev->angles.x = 0.0f; pev->angles.z = 0.0f; }`
     - 二进制产物已编译打包至 `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/dlls/hl.so`（8,483,432 字节，aarch64 ELF）。

### 1.2 触控暂停菜单与生命周期存档流程
1. **触控菜单与存读档入口**：
   - 检查 `/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg`：
     - 第 41 行：`touch_addbutton "menu" "gfx/touch/menu" "cancelselect" 0.520000 0.020000 0.565833 0.185414 255 255 255 170 0 0`
     - 第 37-38 行：`touch_addbutton "quicksave" "gfx/touch/save" "save quick" 0.280000 0.020000 0.325833 0.185414 255 255 255 170 0 0` 与 `touch_addbutton "quickload" "gfx/touch/load" "load quick" 0.340000 0.020000 0.385833 0.185414 255 255 255 170 0 0`
   - `menu` 虚拟按键在 960×266 视口逻辑坐标中心为 $(550, 32)$，对应 480×960 物理屏幕坐标为 $(139, 409)$。点击注入 `cancelselect` 指令呼出暂停菜单。
2. **小应用返回键与生命周期**：
   - 检查 `/Volumes/500GB/Ydpen/halflife_app/src/root.js`：
     - 第 53-57 行（`onShow`）：`this.$page.$npage.setSupportBack(false); this.$page.$npage.on('backpressed', this._backpressed);`
     - 第 25-46 行（`handleBack`）：调用 `var result = hl.stop();`，若返回 `!result.ok` 则保持页面不退出，仅在成功时调用 `this.$page.finish();`。
     - 第 74-78 行（`onHide`）：切后台/灭屏时触发 `hl.save();`。
3. **底层自动保存与恢复机制**：
   - 检查 `/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`：
     - 第 179-199 行（`save_game_locked`）：向 `127.0.0.1:27000` 发送 `"save quick"`，并在 3000ms 超时内轮询 `stat` 确认 `/userdisk/halflife/valve/save/quick.sav` 的 `size > 0` 且修改时间戳发生纳秒级更新。
     - 第 201-219 行（`stop_game_locked`）：必须首先通过 `save_game_locked()` 确认存盘完成，随后发送 `"quit"` 并等待 5000ms 直至 `waitpid` 确认子进程终止。
     - 第 273-300 行（`js_hl_start`）：检测若存在有效 `quick.sav`，动态生成 `/userdisk/halflife/valve/auto_exec.cfg` 并写入 `echo [AUTO] Resuming quick save...\nload quick\n`；若无存档则写入 `map c0a0`。

### 1.3 构建、部署与自动化测试套件
1. **构建与部署脚本**：
   - 检查 `/Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py`：
     - Zig 交叉编译器配置：`/Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig`。
     - 交叉编译参数：`-target aarch64-linux-gnu -shared -fPIC -O2`。
     - exFAT 缓冲机制：编译产物先输出至 APFS 临时目录 `/tmp/libjsapi_hl.so` 与 `/tmp/libwl_center.so`，再通过 `shutil.copyfile` 拷回项目目录，并执行 ELF 校验。
     - 动态库隔离规约：AMR 包内仅含 `libs/arm64/libjsapi_hl.so`，检测到 `libwl_center.so` 则立即抛出异常终止打包。
   - 检查 `/Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py`：
     - 设备序列号：`9DA2200007506350`。
     - 远程退出码包裹层：`command + '; code=$?; printf "\\n__HL_EXIT__%s\\n" "$code"'`。
     - 部署时自动备份旧配置至 `/userdisk/halflife/valve/config-backup-<timestamp>/`，并推送 `hl.so`、`libwl_center.so` 及触控资源。
2. **测试脚本运行结果**：
   - 运行 `python3 tools/test_controls.py`：5 项测试全部通过（Ran 5 tests in 0.278s, OK）。
   - 运行 `node tools/test_lifecycle.mjs`：3 项测试全部通过（pass 3, fail 0, duration 822ms）。
   - 运行 `python3 tools/test_xrcon.py --output /tmp/xrcon_test`：17 项测试全部通过（Ran 17 tests in 18.117s, OK）。
   - 运行 `python3 tools/test_e2e_verification.py --self-test`：全部 127 个测试用例通过（Tier 1: 55/55, Tier 2: 55/55, Tier 3: 12/12, Tier 4: 5/5），退出码为 0。

---

## 2. Logic Chain（推导逻辑链）

1. **NPC 姿态异常与修复有效性推导**：
   - 依据 1.1 观测，`scientist.mdl` 与 `barney.mdl` 根骨骼（Bone 0）父节点为 -1，无控制器，其三维变换直接继承 `(*m_protationmatrix)`；
   - 依据 1.1 源码比对，服务端未在行走中约束 Pitch/Roll，客户端 `StudioDrawModel` 路径未清零俯仰角。当实体受物理碰撞影响获得非零 Pitch 时，根骨骼绕横轴旋转导致模型面部朝地趴行；
   - 依据 1.1 修复代码，服务端在 `MonsterInit` 和 `ChangeYaw` 中保持 `pev->angles.x = 0`，客户端在 `StudioSetUpTransform` 中强制将地面人形实体的 Pitch 与 Roll 置为 0，消除了横轴旋转角度，确保直立姿态恢复。
2. **生命周期自动存档与恢复可靠性推导**：
   - 依据 1.2 观测，Falcon 前端通过 `$npage.setSupportBack(false)` 与 `on('backpressed')` 完整捕获物理返回键事件；
   - 依据 1.2 原生 C 代码，`stop_game_locked` 采取“先确认存盘，后发送 quit”的串行流程，并且在 `stat` 确认时间戳纳秒级更新后才判定保存成功；存盘失败则拒绝杀死子进程，保证游戏现场不丢失；
   - 依据 1.2 启动流程，`js_hl_start` 在检测到 `quick.sav` 时动态生成 `auto_exec.cfg` 执行 `load quick`，消除了命令行参数丢失导致的存档跳过问题，确保恢复进度可靠。
3. **构建、部署与全量测试闭环推导**：
   - 依据 1.3 观测，`build_amr.py` 采用本地 Zig 编译器结合 `/tmp/` 中转方案解决了 exFAT 编译限制，并通过 Zip 结构校验强制实施动态库物理隔离；
   - 依据 1.3 观测，本地测试套件覆盖触控分区、生命周期去重与 XRCON 协议时延；
   - 依据 1.3 观测，端到端测试套件（`test_e2e_verification.py`）建立 127 个覆盖 Tier 1 至 Tier 4 的测试用例，结合纯 Python 图像直方图分析与 15 秒看门狗熔断机制，在自检模式下取得 100% 通过率（退出码 0），具备完备的工程验证能力。

---

## 3. Caveats（边界说明与注意事项）

1. **NPC 俯仰归零适用边界**：
   - `angles[PITCH] = 0.0f` 归零约束必须仅限定于 `MOVETYPE_STEP` 的地面行走实体与显式列举的人形怪物。对于三维空间自由机动实体（如直升机 Apache、鱼龙 Ichthyosaur、天花板藤壶怪 Barnacle），必须维持原有俯仰与横滚角度，不可全局通配。
2. **真机设备操作红线**：
   - 目标测试设备序列号为 `9DA2200007506350`。严禁向其他连接设备（如 3 代笔 `2C11200001902234`）发送任何 ADB 指令。
3. **exFAT 磁盘直接编译限制**：
   - 任何针对 aarch64 动态库（`libjsapi_hl.so`、`libwl_center.so`、`hl.so`）的编译，其输出产物路径必须先指向原生文件系统（如 `/tmp/`），随后复制回工程目录。

---

## 4. Conclusion（结论与交付评估）

1. **NPC 姿态机制勘测完成**：
   - 查明前倾趴地成因，确认服务端与客户端双层 Pitch 置零逻辑已在代码中就绪，并生成了对应的 `hl.so` 动态库。
2. **生命周期与存读档流程勘测完成**：
   - 梳理确认了返回键捕获、XRCON 状态检测式自动保存与 `auto_exec.cfg` 动态恢复流程，逻辑完备。
3. **构建部署与自动化测试套件核验完成**：
   - `build_amr.py` 与 `install_amr.py` 逻辑清晰，动态库隔离规约严密；
   - 本地三项测试全部通过，端到端测试套件具备 127 项全量用例，断言判定严谨。

---

## 5. Verification Method（独立验证方法）

1. **本地单元测试执行命令**：
   ```bash
   # 1. 运行按键与触控布局静态验证
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py

   # 2. 运行生命周期与返回键处理测试
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs

   # 3. 运行宿主机 XRCON 通信与状态机回归测试
   mkdir -p /tmp/xrcon_test && python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py --output /tmp/xrcon_test && rm -rf /tmp/xrcon_test
   ```

2. **端到端测试自检命令**：
   ```bash
   # 运行 127 项全量端到端测试用例自检
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```

3. **真机端到端全量测试执行命令（连接 6 代设备 9DA2200007506350 时）**：
   ```bash
   # 检查目标真机在线状态
   /opt/homebrew/bin/adb -s 9DA2200007506350 get-state

   # 运行全量 127 项真机端到端测试
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --serial 9DA2200007506350
   ```

4. **失效判定准则**：
   - 任一本地测试脚本返回码非 0，判定单元验证失败；
   - 科学家截图解析显示有效非黑像素小于 0.05 或姿态角超出 $[-5^\circ, +5^\circ]$，判定立姿修复失败；
   - 快速保存未能在 3000ms 内检测到 `quick.sav` 时间戳递增，判定生命周期存档机制失败；
   - `test_e2e_verification.py` 退出码非 0，判定端到端验收不通过。
