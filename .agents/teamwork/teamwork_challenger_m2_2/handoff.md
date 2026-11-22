# 对抗验证报告 — 生命周期管理与并发存盘对抗测试

## 1. 观察事实 (Observation)

### 1.1 源代码时序与锁机制观察
1. **前端生命周期控制（`/Volumes/500GB/Ydpen/halflife_app/src/root.js`）**：
   - 第 24-27 行：`handleBack` 入口处执行 `if (this.exiting) return; this.exiting = true; this.statusText = '正在自动存档并退出...';`，建立退出状态标识。
   - 第 30-35 行：执行 `var result = hl.stop();`，若 `!result || !result.ok`，执行 `this.exiting = false; this.statusText = '未能确认存档并退出，请重试或在游戏菜单中保存'; return;`，重置状态并终止退出流程，未调用 `$page.finish()`。
   - 第 36-38 行：仅在 `result.ok` 为真时执行 `this.$page.finish()` 关闭页面。
   - 第 39-42 行：`catch (e)` 异常分支同样执行 `this.exiting = false; this.statusText = '存档失败: ' + e;`。
   - 第 71-75 行（`onHide`）：切后台逻辑校验 `if (!this.exiting && hl && typeof hl.save === 'function') { hl.save(); }`，在 `this.exiting` 为真时跳过保存。
   - 第 78-83 行（`onUnload`）：仅在 `!this.exiting` 且游戏处于运行状态时执行 `hl.stop()`。

2. **原生持久化与退出逻辑（`/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`）**：
   - 第 28 行：定义全局互斥锁 `static pthread_mutex_t g_hl_lock = PTHREAD_MUTEX_INITIALIZER;`，在 `js_hl_start`、`js_hl_send_cmd`、`js_hl_is_running`、`js_hl_stop`、`js_hl_save`、`js_hl_load` 入口处加锁保护。
   - 第 167-176 行：`save_mtime_changed` 在 macOS 平台比对 `before->st_mtimespec.tv_nsec != after->st_mtimespec.tv_nsec`，在 Linux 平台比对 `before->st_mtim.tv_nsec != after->st_mtim.tv_nsec`。
   - 第 180-199 行（`save_game_locked`）：存盘操作首先检查 `is_game_running_locked()` 与目标路径，发送 `save quick` 后进入轮询循环，等待条件为 `stat(g_save_file, &after) == 0 && S_ISREG(after.st_mode) && after.st_size > 0 && (!existed || save_mtime_changed(&before, &after))`，超时时限为 3000ms（`HL_SAVE_TIMEOUT_MS`）。超时未满足条件则返回 0。
   - 第 202-219 行（`stop_game_locked`）：首先调用 `if (!save_game_locked()) return 0;`。当存盘失败时直接返回 0，未向引擎下发 `quit`，未调用 `waitpid` 强行终止子进程。仅在存盘确认成功后才发送 `quit` 并等待子进程终止。
   - 第 276-279 行（`js_hl_start`）：启动前核验自动存档文件有效性：`int has_save = (!force_new && stat(save_file, &saved) == 0 && S_ISREG(saved.st_mode) && saved.st_size > 0 && access(save_file, R_OK) == 0);`。
   - 第 290-293 行：若 `has_save` 为真向 `auto_exec.cfg` 写入 `load quick\n`，否则写入 `map %s\n`（默认 `c0a0`）。

### 1.2 对抗性测试执行结果
1. **前端生命周期与防重入对抗测试（`tools/test_adversarial_lifecycle.mjs`）**：
   - 执行命令：`node /Volumes/500GB/Ydpen/halflife_app/tools/test_adversarial_lifecycle.mjs`
   - 执行输出：
     ```text
     ✔ 对抗测试 1.1: 高频快速连续触发 handleBack 50 次，防重入锁确保 hl.stop 仅执行一次 (5.739833ms)
     ✔ 对抗测试 1.2: onHide 与 _backpressed 竞态对抗，退出中 onHide 严禁触发二次保存 (4.200666ms)
     ✔ 对抗测试 1.3: 先 onHide 后物理返回，生命周期顺序与保存退出互不破坏 (0.446584ms)
     ✔ 对抗测试 1.4: 存盘失败故障恢复与重试通道验证 (0.410208ms)
     ✔ 对抗测试 1.5: 底层抛出未捕获异常时的容错与锁释放验证 (1.40325ms)
     ✔ 对抗测试 1.6: onUnload 在非 exiting 状态下安全终止 (0.377875ms)
     ℹ tests 6
     ℹ suites 0
     ℹ pass 6
     ℹ fail 0
     ```
   - 退出码：0。

2. **原生 C 模块时序、超时与边界对抗测试（`tools/test_adversarial_m2.py`）**：
   - 执行命令：`python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_adversarial_m2.py`
   - 执行输出：
     ```text
     test_adv_01_multithreaded_concurrent_operations_no_deadlock (__main__.AdversarialLifecycleTests) ... ok
     test_adv_02_save_timeout_strictly_rejects_quit_and_kill (__main__.AdversarialLifecycleTests) ... ok
     test_adv_03_save_timeout_then_retry_success (__main__.AdversarialLifecycleTests) ... ok
     test_adv_04_high_frequency_nanosecond_saves_same_second (__main__.AdversarialLifecycleTests) ... ok
     test_adv_05_old_save_anti_passthrough_no_false_positive (__main__.AdversarialLifecycleTests) ... ok
     test_adv_06_truncated_zero_byte_during_write_rejected (__main__.AdversarialLifecycleTests) ... ok
     test_adv_07_cold_boot_empty_save_file_falls_back_to_map (__main__.AdversarialLifecycleTests) ... ok
     test_adv_08_cold_boot_nonexistent_save_file_falls_back_to_map (__main__.AdversarialLifecycleTests) ... ok
     test_adv_09_cold_boot_directory_save_file_falls_back_to_map (__main__.AdversarialLifecycleTests) ... ok
     test_adv_10_cold_boot_unreadable_save_file_falls_back_to_map (__main__.AdversarialLifecycleTests) ... ok
     test_adv_11_cold_boot_force_new_overrides_valid_save (__main__.AdversarialLifecycleTests) ... ok
     test_adv_12_cold_boot_valid_save_loads_quick (__main__.AdversarialLifecycleTests) ... ok

     ----------------------------------------------------------------------
     Ran 12 tests in 13.270s

     OK
     ```
   - 退出码：0。

3. **现有测试套件全量回归核验**：
   - `node tools/test_lifecycle.mjs`：3/3 通过，退出码 0。
   - `python3 tools/test_xrcon.py --output /tmp`：17/17 通过，退出码 0。
   - `python3 tools/test_controls.py`：5/5 通过，退出码 0。
   - `python3 tools/test_e2e_verification.py --self-test`：127/127 通过，退出码 0。

---

## 2. 推导逻辑链 (Logic Chain)

1. **重入与并发触发安全性推导**：
   - 依据 1.1 观察，`src/root.js` 在进入 `handleBack` 时同步检查 `if (this.exiting) return;` 并立刻置位 `this.exiting = true;`；
   - 依据 1.2 对抗测试 1.1 实测结果，连续 50 次并发触发返回事件，底层 `hl.stop()` 仅被调度 1 次，页面 `finish()` 仅执行 1 次；
   - 依据 1.2 对抗测试 1.2 实测结果，在退出流程期间收到系统级 `onHide` 事件时，条件 `!this.exiting` 为假，成功阻断并发调用 `hl.save()`；
   - 依据 1.2 对抗测试 1.5 实测结果，当底层调用遭遇异常时，异常捕获分支将状态重置为 `exiting = false`，保证界面未处于非预期锁定状态，用户可再次发起退出重试。

2. **存盘超时保护与现场保全推导**：
   - 依据 1.1 观察，`libjsapi_hl.c` 中 `stop_game_locked` 执行 `quit` 的前置条件为 `save_game_locked()` 返回真值；
   - 依据 1.2 对抗测试 2（`test_adv_02`）实测结果，模拟引擎 XRCON 通信延迟或未完成写盘，在经过 3000ms（实测耗时 2.9~3.1 秒）等待后返回失败；
   - 监测记录显示 XRCON 通道未发送 `quit` 帧，子进程未被回收（`alive == 1`），且宿主前端未调用 `finish()` 并更新提示信息引导重试；
   - 依据 1.2 对抗测试 3（`test_adv_03`）实测结果，在超时重试场景下，当引擎第二次成功更新存档时，`stop_game_locked` 正常推进完成 `quit` 发送与子进程回收，验证了故障恢复路径的完整性。

3. **时间戳防穿透与纳秒级分辨率推导**：
   - 依据 1.1 观察，`save_mtime_changed` 提取了纳秒字段（`tv_nsec`）进行比较；
   - 依据 1.2 对抗测试 4（`test_adv_04`）实测结果，在秒级时间戳（`tv_sec`）完全相同的同一秒内，以 20ms 间隔高频连续保存 5 次，每次仅改变 `tv_nsec` 纳秒值，全部 5 次保存均被准确识别并判定成功，消除了秒级粗粒度时间戳导致的高频存盘误判超时；
   - 依据 1.2 对抗测试 5（`test_adv_05`）实测结果，预先存在旧存档文件，当收到存盘指令但时间戳未更新时，轮询循环严格判定未完成并超时返回 0，未出现将旧文件误判为新文件的穿透现象；
   - 依据 1.2 对抗测试 6（`test_adv_06`）实测结果，当文件被写入但字节数为 0 时，`after.st_size > 0` 条件未满足，拒绝承认存盘成功。

4. **冷启动恢复边界防御推导**：
   - 依据 1.1 观察，`js_hl_start` 综合校验 `stat == 0`、`S_ISREG`、`st_size > 0` 与 `access(R_OK) == 0`；
   - 依据 1.2 对抗测试 7-10 实测结果，当 `quick.sav` 分别处于 0 字节空文件、文件缺失、目录伪装、只读/无读取权限四种异常边界状态时，`has_save` 均准确评估为 0，启动脚本写入 `map c0a0`，避免了由于执行无效 `load quick` 导致的引擎加载卡死。

---

## 3. 局限与注意事项 (Caveats)

1. **非空损坏存档的内容校验边界**：
   `native/libjsapi_hl.c` 对存档文件的校验基于文件元数据（大小大于 0、普通文件、具备读权限），未在 C 胶水层直接解析 Half-Life 存档的二进制文件头。若 `quick.sav` 为非零字节的损坏数据，启动配置仍会写入 `load quick`，此时依赖 Half-Life / Xash3D 引擎自身的 `Host_Loadgame_f` 文件头解析校验进行错误拦截。
2. **极端并发场景的执行环境说明**：
   本次对抗测试分别在 macOS 本地环境针对独立编译的原生测试二进制与 QuickJS 组件进行了全量时序模拟。真机物理环境下依赖目标硬件 Flash 存储控制器的写盘性能与文件系统纳秒支持情况。

---

## 4. 结论 (Conclusion)

对游戏生命周期管理与存读档机制的重入防范、存盘超时故障恢复、时间戳纳秒防穿透以及冷启动异常恢复四项对抗验证目标实施了针对性测试，18 项对抗用例与 152 项既有用例全部通过，时序行为符合架构规约。

裁决结果：**APPROVE**。

---

## 5. 独立复现与验证方法 (Verification Method)

审查人员可使用以下命令独立复现全量对抗验证：

1. **执行前端生命周期高频重入与竞态对抗测试**：
   ```bash
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_adversarial_lifecycle.mjs
   ```
   *预期结果*：6 项测试全部 PASS，退出码为 0。

2. **执行原生 C 模块存盘超时、纳秒防穿透与冷启动边界测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_adversarial_m2.py
   ```
   *预期结果*：12 项测试全部 OK，退出码为 0。

3. **执行全量回归测试集**：
   ```bash
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py --output /tmp
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
   *预期结果*：所有回归脚本退出码均为 0。
