# Handoff Report — Milestone 2 (M2: 居中显示与生命周期/NPC姿态集成验证)

## 0. 里程碑门禁结论 (Gate Verdict)
- **Gate Result**: **PASS**
- **Worker**: DONE（Wayland 拦截库产物核查、NPC 姿态与生命周期配置核验、全部 4 项本地测试套件全量通过）
- **Reviewers**:
  - `reviewer_m2_1_rep`: **APPROVE**（Wayland 居中显示、协议合规、坐标平移与运行库隔离审查通过）
  - `reviewer_m2_2`: **APPROVE**（NPC 姿态双层控制、触控菜单与存读档生命周期机制审查通过）
- **Challengers**:
  - `challenger_m2_1`: **APPROVE**（Wayland 极端坐标抗扰、协议状态机防重入与动态库隔离实测通过）
  - `challenger_m2_2`: **APPROVE**（前端生命周期防重入、高频纳秒级存盘及冷启动异常恢复实测通过）
- **Forensic Auditor**: **CLEAN**（零作弊、无硬编码或假测试，实现真实可靠）

---

## 1. 观察记录 (Observation)
1. **Wayland 居中显示与稳定性（需求 R2）**：
   - `native/wl_center.c` 中通过 `dlsym` 拦截，创建子表面并定位至 $(0, 107)$ 像素，启用去同步渲染（`wl_subsurface_set_desync`），清空子表面输入区域；
   - 960x480 纯黑 SHM 背景缓冲在收到 `xdg_surface.ack_configure`（Opcode 4）后挂载，符合 Wayland 协议规范；
   - 拦截并过滤 `xdg_toplevel` 的 Opcode 5/6/10/12，锁定全屏状态，消除窗口随机漂移；
   - 触控与指针事件经过 $y - 107$ 平移并限制在 $[0, 265]$ 区间内，坐标变换在极端值与边界下表现稳定。
2. **NPC 姿态双层控制（需求 R3）**：
   - 客户端 `StudioModelRenderer.cpp` 与服务端 `monsters.cpp` 联动，对 `MOVETYPE_STEP` 地面实体与人形白名单强制 Pitch 与 Roll 归零，消除了科学家与保安 NPC 倒立或前倾趴地异常，且未破坏三维机动怪物行为。
3. **触控菜单与生命周期存续（需求 R3）**：
   - `assets/valve/touch.cfg` 顶部中央配置了 `menu` 按钮（`cancelselect`）；
   - 前端 `src/root.js` 拦截物理返回键调用 `hl.stop()`；原生层 `libjsapi_hl.c` 下发 `save quick` 并经由纳秒级 `stat` 时间戳比对与文件尺寸校验确认存盘完成后才执行 `quit`；
   - 再次进入时自动向 `auto_exec.cfg` 写入 `load quick` 恢复游戏进度。
4. **自动化测试套件执行**：
   - `test_controls.py`: 5/5 通过（退出码 0）；
   - `test_lifecycle.mjs`: 3/3 通过（退出码 0）；
   - `test_xrcon.py`: 17/17 通过（退出码 0）；
   - `test_e2e_verification.py --self-test`: 127/127 通过（退出码 0）。

---

## 2. 结论与下一步
M2 里程碑所有核心指标均达到要求，门禁全绿通过。全面推进至里程碑 3（M3: 原生小应用打包部署与真机 9DA2200007506350 全量端到端验收）。
