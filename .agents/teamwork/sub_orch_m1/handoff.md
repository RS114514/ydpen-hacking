# Handoff Report — Milestone 1 (M1: 触控系统虚拟摇杆与防抢占重构)

## 0. 里程碑门禁结论 (Gate Verdict)
- **Gate Result**: **PASS**
- **Worker**: DONE (单元测试、XRCON、生命周期及 E2E 离线自检全量通过)
- **Reviewers**:
  - `reviewer_m1_1`: **APPROVE**
  - `reviewer_m1_2`: **APPROVE**
- **Challengers**:
  - `challenger_m1_1`: **APPROVE** (实证消除 50% 死区，多指并发无冲突)
  - `challenger_m1_2`: **APPROVE** (50,000 次高频并发与几何极限测试无按键挂起)
- **Forensic Auditor**: **CLEAN** (零作弊、无硬编码或假测试)

---

## 1. 观察记录 (Observation)

1. **防穿透与防抢占阻断已完整落地 (`in_touch.c`)**：
   - 源码路径：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`
   - 在 `Touch_ButtonPress` 函数的 `type == event_down` 分支中，当命中 `touch_command` 或 `touch_wheel` 前景按键并派发指令后，执行 `break;` 跳出倒序遍历循环；
   - 在 `type == event_up` 分支中，当按键匹配释放后同样执行 `break;`；
   - 阻断了右侧操作按键（开火 `fire`、跳跃 `jump`、换弹 `reload`、使用 `use` 等）向底层全局 `touch_look` 视角的渗透。

2. **连续比例虚拟摇杆已重构上线 (`touch.cfg`)**：
   - 配置文件路径：`assets/valve/touch.cfg` 与 `dist_assets/valve/touch.cfg`
   - 将原十字键 `dpad`（`_dpad`）替换为引擎原生虚拟摇杆 `joy`（绑定动作指令 `_joy`）；
   - 属性标志位配置为 2048 (`TOUCH_FL_STICK`)，材质贴图配置为 `gfx/touch/stick_ring` 与 `gfx/touch/stick_thumb`（PNG 128x128 资源已同步就绪）；
   - 几何坐标配置为：`0.040000 0.220000 0.200708 0.800000`：
     - 水平跨度：$(0.200708 - 0.040000) \times 960 = 154.27968$ 像素；
     - 垂直跨度：$(0.800000 - 0.220000) \times 266 = 154.28000$ 像素；
     - 像素宽高差仅 $0.00032$ 像素，严格符合正方形像素比；
     - 左侧控制分区：$x_2 = 0.200708 \le 0.260000$，与视角区（$x \ge 0.26$）存在 56.9 像素安全隔离带；
     - HUD 避让：$y_2 \times 266 = 212.8 \le 216$ 像素，底部预留 53.2 像素安全避让高度。

3. **测试套件断言同步与全量通过 (`test_controls.py`)**：
   - 更新 `tools/test_controls.py` 中的 `expected_actions`（包含 `_joy`）与 `left_buttons`（包含 `joy`）；
   - 完整保留所有关于正方形比例、HUD 避让、分区隔离与优先级断言；
   - 本地全量回归测试套件实测全部通过（退出码 0）：
     - `test_controls.py`: 5/5 通过；
     - `test_xrcon.py`: 17/17 通过；
     - `test_lifecycle.mjs`: 3/3 通过；
     - `test_e2e_verification.py --self-test`: 127/127 通过；
     - `build_amr.py`: AMR 包成功编译生成并自动推送到 6 代真机。

---

## 2. 逻辑推导链 (Logic Chain)

1. **按键穿透与视角抢占消除机制**：
   - 引擎触控按键列表采用倒序遍历。
   - `look` 视角层最先注册，处于链表首部；右侧交互操作按钮靠后注册，处于链表尾部。
   - 用户点击右侧操作按键时，倒序遍历先命中顶层操作按钮。
   - 在添加 `break;` 之后，事件被操作按钮独占消费并立即终止循环，事件不会继续下渗至 `look` 控件。
   - 右侧操作按键点击不会再将该手指绑定为视角控制手指，消除了点击按键瞬间微小位移导致的准星剧烈晃动，并恢复了长按连射时另一手指滑动视角的并发能力。

2. **连续比例模拟量与 50% 死区消除机制**：
   - 原十字键（`_dpad`）在计算过程中调用 `round()` 截断，导致位移小于 50% 半径时输出恒为 0，产生中心 50% 死区。
   - 重构为 `_joy` 并附加 `TOUCH_FL_STICK`（2048）后，引擎调用 `Touch_StickVector` 计算归一化向量。
   - 直接向客户端输出连续模拟量浮点数，消除了离散阶跃截断，手指轻微推移即可获得平滑连续位移反馈。

3. **双指并发物理与逻辑绝对隔离**：
   - 左侧摇杆与身法按键全部严格约束在 $x \le 0.26$；
   - 右侧视角滑动与操作按键全部严格约束在 $x \ge 0.26$；
   - 左右两区存在 56.9 像素的物理隔离带，结合独立的 `move_finger` 与 `look_finger` 状态机，硬件双槽位输入流彻底解耦。

---

## 3. 注意事项 (Caveats)

1. **引擎源码与真机运行依赖**：
   `in_touch.c` 源码修复已合入代码仓库。真机运行时，`touch.cfg` 的虚拟摇杆重构直接通过引擎原生内置的 `_joy` 与 `TOUCH_FL_STICK`（2048）支持生效。
2. **硬件槽位规范**：
   有道词典笔 6 代电容屏硬件原生支持 2 个触控槽位（Slot 0 与 Slot 1），系统与测试套件基于双指并发（左手摇杆移动、右手滑动视角/点击）进行最优化设计。

---

## 4. 结论 (Conclusion)

里程碑 1（M1: 触控系统虚拟摇杆与防抢占重构）的所有目标均已达成：
- 按键穿透与视角抢占问题彻底消除；
- 虚拟摇杆重构完成并经严格几何计算验证与 50,000 次高频对抗压测；
- 测试套件断言同步完成，全量自动化验证 100% 通过；
- 真实性审计确认实现真实无作弊。
- **本里程碑圆满结束，建议主编排器推进至里程碑 2（M2: 居中显示与生命周期/NPC姿态集成验证）**。

---

## 5. 验证复现方法 (Verification Method)

在项目工作目录下执行以下命令即可复现全部验证结果：
```bash
# 1. 验证按键配置、像素正方形比例与屏幕分区隔离
PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls

# 2. 验证宿主机 XRCON 通信回归
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py

# 3. 验证小应用生命周期与退出逻辑
node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs

# 4. 验证 127 项全量端到端测试用例
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test

# 5. 验证 AMR 打包构建与真机部署
python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
```
全部命令均应返回退出代码 0。

---

## 6. 状态索引与关键产物 (Artifact Index)
- 里程碑范围定义：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m1/SCOPE.md`
- 门禁状态文件：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m1/GATE_STATUS.md`
- 进度记录文件：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m1/progress.md`
- Worker 交付报告：`/Volumes/500GB/Ydpen/.agents/teamwork/worker_m1/handoff.md`
- Reviewer 1 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m1_1/handoff.md`
- Reviewer 2 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m1_2/handoff.md`
- Challenger 1 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m1_1/handoff.md`
- Challenger 2 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m1_2/handoff.md`
- Forensic Auditor 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/auditor_m1_1/handoff.md`
