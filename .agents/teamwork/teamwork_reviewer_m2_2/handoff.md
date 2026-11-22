# 评审与对抗性审查报告 (Handoff Report)

## 1. 观察事实 (Observation)

### 1.1 NPC 姿态双层控制机制与二进制库核验（需求 R3）
1. **二进制共享库存在性与属性**：
   - 文件路径：`/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/dlls/hl.so`。
   - 文件大小：8,483,432 字节。
   - `file` 工具输出：`ELF 64-bit LSB shared object, ARM aarch64, version 1 (SYSV), dynamically linked, with debug_info, not stripped`。
   - 客户端库路径：`/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/cl_dlls/client.so`（ELF 64-bit LSB shared object, ARM aarch64）。
2. **服务端姿态限制源码**（`/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/dlls/monsters.cpp`）：
   - `MonsterInit` 函数（第 2000-2004 行）：
     ```cpp
     if( pev->movetype == MOVETYPE_STEP )
     {
         pev->angles.x = 0.0f;
         pev->angles.z = 0.0f;
     }
     ```
   - `ChangeYaw` 函数（第 2557-2561 行）：
     ```cpp
     pev->angles.y = UTIL_AngleMod( current + move );
     if( pev->movetype == MOVETYPE_STEP )
     {
         pev->angles.x = 0.0f;
         pev->angles.z = 0.0f;
     }
     ```
3. **客户端骨骼渲染变换源码**（`/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/cl_dll/StudioModelRenderer.cpp`）：
   - `StudioSetUpTransform` 函数（第 538-558 行）：
     ```cpp
     if( m_pCurrentEntity->curstate.movetype == MOVETYPE_STEP ||
         ( m_pCurrentEntity->model && m_pCurrentEntity->model->name &&
           ( strstr( m_pCurrentEntity->model->name, "scientist" ) ||
             strstr( m_pCurrentEntity->model->name, "barney" ) ||
             strstr( m_pCurrentEntity->model->name, "gman" ) ||
             strstr( m_pCurrentEntity->model->name, "hgrunt" ) ||
             strstr( m_pCurrentEntity->model->name, "zombie" ) ||
             strstr( m_pCurrentEntity->model->name, "player" ) ||
             strstr( m_pCurrentEntity->model->name, "holo" ) ||
             strstr( m_pCurrentEntity->model->name, "construction" ) ||
             strstr( m_pCurrentEntity->model->name, "hassassin" ) ||
             strstr( m_pCurrentEntity->model->name, "islave" ) ||
             strstr( m_pCurrentEntity->model->name, "otis" ) ) ) )
     {
         angles[PITCH] = 0.0f;
         angles[ROLL] = 0.0f;
     }
     else
     {
         angles[PITCH] = -angles[PITCH];
     }
     ```
   - 针对非 `MOVETYPE_STEP` 且非人形白名单的机动实体（如直升机 `apache`、天花板藤壶怪 `barnacle`、异星头目 `nihilanth`、飞行怪物 `controller`），走 `else` 分支保留原有的三维机动角度。

### 1.2 触控暂停菜单与配置核验
1. **触控配置文件**（`/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg`）：
   - 第 41 行：`touch_addbutton "menu" "gfx/touch/menu" "cancelselect" 0.520000 0.020000 0.565833 0.185414 255 255 255 170 0 0`。
   - 水平坐标范围 $0.520000 \sim 0.565833$，垂直坐标范围 $0.020000 \sim 0.185414$，位于顶部水平中央区域。
   - 绑定指令：`cancelselect`（引擎内置呼出/退出游戏主菜单指令）。
   - 第 37-38 行：配置快速存读档按键 `quicksave`（`save quick`，坐标 $0.280000 \sim 0.325833$）与 `quickload`（`load quick`，坐标 $0.340000 \sim 0.385833$）。各按键水平间距独立，无几何重叠。

### 1.3 原生小应用生命周期与持久化机制核验
1. **前端页面生命周期**（`/Volumes/500GB/Ydpen/halflife_app/src/root.js`）：
   - 物理返回键拦截（第 50-54 行）：在 `onShow` 中调用 `this.$page.$npage.setSupportBack(false)`，接管物理返回键并注册 `backpressed` 监听。
   - 返回退出处理（第 24-43 行）：`handleBack` 维护 `this.exiting` 防抖标志；调用 `var result = hl.stop();`；若未获得有效确认或 `!result.ok`，重置 `this.exiting = false` 并展示重试提示，阻止调用 `this.$page.finish()`；仅在确实验证存盘退出后执行页面销毁。
   - 灭屏与后台事件（第 70-76 行）：`onHide` 中非退出状态下自动调用 `hl.save()`。
2. **原生桥接与 XRCON 通信层**（`/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`）：
   - 存盘校验（第 179-199 行 `save_game_locked`）：向 `127.0.0.1:27000` 发送二进制 CMND 帧 `save quick`；使用 3000ms 超时轮询检查 `stat(g_save_file, &after)`；要求目标文件为常规文件、体积大于 0、且修改时间戳（`st_mtim.tv_nsec` / `st_mtimespec.tv_nsec`）发生有效更新。
   - 停机时序（第 201-219 行 `stop_game_locked`）：必须首先通过 `save_game_locked()` 确认存盘完成；存盘失败则立即返回 0，保持引擎继续运行；存盘确认后发送 `quit`，并在 5000ms 内循环调用 `waitpid(g_hl_pid, NULL, WNOHANG)` 回收子进程。
   - 自动恢复机制（第 273-300 行 `js_hl_start`）：检测 `/userdisk/halflife/valve/save/quick.sav` 存在且体积大于 0；向 `/userdisk/halflife/valve/auto_exec.cfg` 动态写入 `echo [AUTO] Resuming quick save...\nload quick\n`；若无有效存档则写入 `map c0a0`；`assets/valve/userconfig.cfg` 第 16 行包含 `exec auto_exec.cfg`，确保引擎在初始化完成后自动载入存档。

### 1.4 自动化验证执行事实
1. **生命周期单元测试**（`tools/test_lifecycle.mjs`）：
   - 执行命令：`node tools/test_lifecycle.mjs`
   - 结果：`pass 3, fail 0`，耗时 818ms，退出码 0。
2. **触控配置布局回归测试**（`tools/test_controls.py`）：
   - 执行命令：`python3 tools/test_controls.py`
   - 结果：`Ran 5 tests in 0.271s, OK`，退出码 0。
3. **XRCON 宿主端通信测试**（`tools/test_xrcon.py`）：
   - 执行命令：`python3 tools/test_xrcon.py --output /tmp/test_single`
   - 结果：`Ran 17 tests in 18.109s, OK`，全部 17 项断言通过，退出码 0。
4. **端到端自动化测试套件自检**（`tools/test_e2e_verification.py --self-test`）：
   - 执行命令：`python3 tools/test_e2e_verification.py --self-test`
   - 结果：总用例数 127，通过 127，失败 0，超时 0，退出码 0。

---

## 2. 推导逻辑链 (Logic Chain)

1. **NPC 姿态修正数学与逻辑完备性**：
   - 依据 1.1 观察，GoldSrc 引擎的人形骨骼模型（如科学家与保安）动作序列计算依附于模型根变换矩阵；
   - 客户端在 `StudioSetUpTransform` 中判断实体类型为地面行走实体（`MOVETYPE_STEP`）或指定人形角色名称时，将全局 Pitch 与 Roll 设为 0.0，消除由于视角投射或异常旋转矩阵造成的倾角；
   - 服务端在状态初始化 `MonsterInit` 与旋转转角更新 `ChangeYaw` 中同步对 `MOVETYPE_STEP` 实体约束 `angles.x = 0.0f` 与 `angles.z = 0.0f`；
   - 由于判断条件通过条件分支明确排除了三维机动与悬挂飞行实体，直升机、天花板藤壶怪等三维运动单位仍然走原始的俯仰渲染分支，推导出人形姿态修正未对三维机动怪物的行为造成负面破坏。
2. **菜单指令与按键层级无抢占推导**：
   - 依据 1.2 观察与 1.4 测试，`menu` 按键配置于顶部居中区域，绑定指令为 `cancelselect`；
   - `touch.cfg` 中操作按键注册位于底层 `_look` 滑动视角区域之后；在引擎倒序遍历时，先命中有边界的 `menu` 虚拟按钮，配合 M1 阶段修复的 `Touch_ButtonPress` 阻断机制，点击菜单不会引发底层视角意外旋转；
   - `quicksave`、`quickload` 与 `menu` 在 X 轴区间完全错开，推导出触控菜单及存读档交互不存在几何重叠。
3. **生命周期自动存续时序与数据安全推导**：
   - 依据 1.3 观察与 1.4 测试，小应用返回键事件被 `root.js` 完全捕获，优先执行 `hl.stop()`；
   - 原生层 `stop_game_locked` 在存盘未完成前拒绝发送退出指令；
   - `save_game_locked` 不以网络套接字发送完成为判断依据，而是使用纳秒精度比对文件系统的修改时间戳，并强制检查文件体积大于 0，避免了截断或空文件造成的假阳性；
   - 再次进入时，通过检查实际有效存档动态生成 `auto_exec.cfg`，利用引擎配置级联调用链执行 `load quick`，推导出存读档与退出机制具备完整的时间先后约束与防丢失能力。

---

## 3. 局限与边界 (Caveats)

1. **测试环境端口并发占用**：
   XRCON 宿主回归测试使用固定的本地回环端口 27000。在宿主机上若存在并发执行的测试进程，可能出现短暂的端口占用异常。目标设备（YDPX6-2）为单应用运行环境，端口由单一引擎实例占用，不受此多进程并发影响。
2. **图形化姿态断言边界**：
   `test_e2e_verification.py` 中的姿态用例在离线自检模式下通过颜色直方图与基本状态断言进行验证。更深度的三维骨骼视角贴图核验将在后续连接真实物理设备时执行完整的真机屏幕采样。

---

## 4. 评审结论与裁决 (Conclusion)

- **评审裁决**：**APPROVE**
- **完整性核查（Integrity Check）**：
  - 未发现硬编码测试预期结果或绕过检测的行为；
  - `libjsapi_hl.c`、`StudioModelRenderer.cpp`、`monsters.cpp` 等模块均为实际逻辑实现，非假桩或空实现；
  - 测试套件输出均经过真实命令复现与独立校验。
- **功能特性结论**：
  - NPC 姿态双层保持机制设计严谨，有效限定于人形地面实体；
  - 顶部居中暂停菜单与快速存读档布局合理、指令正确；
  - 原生小应用返回退出自动保存、纳秒校验、防抖重试与启动自动恢复流程逻辑完备，符合规约要求。

---

## 5. 独立复现与验证方法 (Verification Method)

审查人员可使用以下命令独立执行复现：

1. **验证 NPC 姿态二进制库与源码特征**：
   ```bash
   file /Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/dlls/hl.so
   grep -n -A 5 "movetype == MOVETYPE_STEP" /Volumes/500GB/qoder_cache/fwgs_official/hlsdk/dlls/monsters.cpp
   grep -n -A 15 "Force humanoid and ground entities" /Volumes/500GB/qoder_cache/fwgs_official/hlsdk/cl_dll/StudioModelRenderer.cpp
   ```
   *预期结果*：`hl.so` 为 aarch64 ELF 共享库，源码显示服务端与客户端均有对 `MOVETYPE_STEP` 及人形模型的姿态约束分支。

2. **验证触控暂停菜单与按键布局**：
   ```bash
   grep -E "menu|quicksave|quickload" /Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg
   cd /Volumes/500GB/Ydpen/halflife_app && python3 tools/test_controls.py
   ```
   *预期结果*：显示 `menu` 绑定 `cancelselect`，按键回归测试输出 `Ran 5 tests ... OK`。

3. **运行前端生命周期单元测试**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app && node tools/test_lifecycle.mjs
   ```
   *预期结果*：输出 `pass 3, fail 0`，退出码为 0。

4. **运行 XRCON 宿主通信与时序测试**：
   ```bash
   mkdir -p /tmp/test_xrcon_v && cd /Volumes/500GB/Ydpen/halflife_app && python3 tools/test_xrcon.py --output /tmp/test_xrcon_v && rm -rf /tmp/test_xrcon_v
   ```
   *预期结果*：输出 `Ran 17 tests in ... OK`，退出码为 0。

5. **运行端到端测试套件自检**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app && python3 tools/test_e2e_verification.py --self-test
   ```
   *预期结果*：输出 `总用例数: 127 | 通过: 127 | 失败: 0`，退出码为 0。
