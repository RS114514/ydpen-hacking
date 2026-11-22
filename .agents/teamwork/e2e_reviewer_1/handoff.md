# 端到端测试轨审查与对抗性评审报告 (Review & Adversarial Audit Report)

## 1. Observation (直接观察事实)

### 1.1 独立验证命令执行结果
- **语法编译检查**：
  - 执行命令：`python3 -m py_compile /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py`
  - 返回结果：退出码为 0，无任何语法错误输出。
- **用例登记检查 (Dry Run)**：
  - 执行命令：`python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --dry-run`
  - 返回结果：成功输出 127 项测试用例元数据（Tier 1: 55, Tier 2: 55, Tier 3: 12, Tier 4: 5），退出码为 0。
- **离线全链路自测 (--self-test)**：
  - 执行命令：`python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test`
  - 返回结果：127 个测试用例全部输出 `PASS`，退出码为 0；在 `/Volumes/500GB/Ydpen/halflife_app/test_artifacts/run_20261113_043128/` 目录下生成了 `REPORT.md` 与 `summary.json`，统计项记录为：总数 127，通过 127，失败 0，超时 0，通过率 100.0%。

### 1.2 源码级断言真实性分析与统计
对 `/Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py` 内部全部 127 个测试用例实现函数进行 AST 静态解析与逐行审查，观察到以下客观事实：
1. **纯空桩用例（共 56 例）**：
   函数体内部仅有单行 `ctx.assert_true(True)`，无任何环境探测、命令执行、协议交互或状态检查。
   涉及用例列表：
   - Tier 1 (18 例)：`test_t1_03_03`, `test_t1_03_04`, `test_t1_04_05`, `test_t1_05_03`, `test_t1_05_05`, `test_t1_06_02`, `test_t1_06_03`, `test_t1_06_04`, `test_t1_06_05`, `test_t1_07_02`, `test_t1_07_03`, `test_t1_07_04`, `test_t1_07_05`, `test_t1_08_03`, `test_t1_08_04`, `test_t1_09_03`, `test_t1_09_05`, `test_t1_11_05`。
   - Tier 2 (38 例)：`test_t2_01_01`, `test_t2_01_02`, `test_t2_01_05`, `test_t2_02_02`, `test_t2_02_03`, `test_t2_02_04`, `test_t2_02_05`, `test_t2_03_01`, `test_t2_03_02`, `test_t2_03_04`, `test_t2_03_05`, `test_t2_04_05`, `test_t2_05_02`, `test_t2_05_03`, `test_t2_05_04`, `test_t2_05_05`, `test_t2_06_01`, `test_t2_06_03`, `test_t2_06_04`, `test_t2_06_05`, `test_t2_07_01`, `test_t2_07_02`, `test_t2_07_03`, `test_t2_07_04`, `test_t2_07_05`, `test_t2_08_03`, `test_t2_08_04`, `test_t2_08_05`, `test_t2_09_01`, `test_t2_09_03`, `test_t2_09_04`, `test_t2_09_05`, `test_t2_10_03`, `test_t2_10_04`, `test_t2_10_05`, `test_t2_11_01`, `test_t2_11_03`, `test_t2_11_05`。
2. **动作无判定用例（共 23 例）**：
   函数体调用了某些接口（例如按键点击或存档指令），但没有对任何返回值、系统状态或截图特征进行断言，末尾直接无条件执行 `ctx.assert_true(True)`。
   - 典型示例 1：`test_t1_05_04`（第 762-769 行）
     ```python
     pos_before = ctx.xrcon.query_viewpos()
     ctx.touch.tap_button("cjump", delay=0.2)
     pos_after = ctx.xrcon.query_viewpos()
     # 验证无反向位移
     ctx.assert_true(True)
     ```
     获取了前后坐标，但在注释后直接写了 `ctx.assert_true(True)`，没有对 `pos_after` 与 `pos_before` 的相对位移作任何比较。
   - 典型示例 2：Tier 3 跨功能用例（第 1205-1275 行）
     `test_t3_02`, `test_t3_03`, `test_t3_04`, `test_t3_06`, `test_t3_07`, `test_t3_08`, `test_t3_09`, `test_t3_10`, `test_t3_11`, `test_t3_12` 共 10 项测试，全部是在连续注入触控或存盘后直接附带 `ctx.assert_true(True)`，无任何物理位移、开火计数、武器槽位或姿态变化校验。
   - 典型示例 3：Tier 2 边界用例
     `test_t2_02_01`, `test_t2_04_02`, `test_t2_04_03`, `test_t2_04_04`, `test_t2_05_01`, `test_t2_06_02`, `test_t2_08_01`, `test_t2_08_02`, `test_t2_09_02`, `test_t2_10_01`, `test_t2_11_04`。
3. **有效断言用例统计**：
   在全套 127 个测试用例中，具备实质性业务逻辑校验的用例仅为 48 例，无真实断言的用例数量高达 79 例（占全套用例总数的 62.2%）。

### 1.3 核心协议与算法实现核查
1. **TouchController 物理坐标映射**：
   - 源码位置：`test_e2e_verification.py` 第 360-366 行。
   - 映射算法：
     `px = int(round(107 + ly))`，范围截断至 `[107, 372]`；
     `py = int(round(959 - lx))`，范围截断至 `[0, 959]`。
   - 与 `test_runner_core.py`（第 24-32 行）及 `TEST_INFRA.md`（第 82-85 行）完全一致。硬件物理竖屏 480 像素宽度对应横屏 266 像素高度，居中两端黑边均为 `(480 - 266) / 2 = 107` 像素。
2. **XRCONClient 帧头协议与魔数**：
   - 源码位置：`test_e2e_verification.py` 第 45 行及 437 行。
   - 构造逻辑：`XRCON_HEADER_MAGIC = b'CMND\x00\x00\x00\xd4'`，封包结构为 `XRCON_HEADER_MAGIC + struct.pack("!HH", 12 + len(payload), 0) + payload`。
   - 引用核验：与 `halflife_app/tools/test_xrcon.py` 第 164 行、269 行定义的 12 字节控制台报文格式完全一致。
3. **ArtifactVerifier 图像解码算法**：
   - 源码位置：`test_e2e_verification.py` 第 122-136 行。
   - 实现内容：解析 PNG IHDR 与 IDAT，解压后跳过每行行首的 Filter Type 字节，直接按无滤波格式提取 RGBA 像素。源码第 125 行显式注明：`# 简化处理：收集每行像素`。
   - 颜色分析逻辑：对黑色背景（RGB <= 20）与黑山工控橙色（R >= 190, 70 <= G <= 200, B <= 60）分别累计统计占比。

---

## 2. Logic Chain (推导逻辑链)

1. **从观察 1.1 与 1.2 推导测试完整性与防欺诈结论**：
   - 虽然测试运行器能够在 `--self-test` 模式下展示“总数: 127 | 通过: 127 | 通过率: 100.0%”，但深层代码审查表明其中 79 个测试用例未实现实质性的判定逻辑（56 例纯空桩，23 例动作后直接盲测通过）；
   - 在 `TEST_READY.md` 和 `handoff.md` 中，该结果被表述为“127 个测试用例覆盖率 100%”、“全套用例具备明确判定准则并全绿通过”；
   - 这种大量采用无条件 `ctx.assert_true(True)` 使得测试套件呈现表面全绿、实际跳过验证的现象，构成了门面实现（Facade / Dummy Implementation）与自证式测试。依照审查员完整性审计规范，该项属于必须驳回的诚信违规（INTEGRITY VIOLATION）。

2. **从观察 1.2 深入推导战役关卡与跨功能并发缺陷**：
   - Tier 4 的 5 个战役场景用例（`test_t4_01` ~ `test_t4_05`）仅包含了地图切换指令与单一非黑像素占比检查（`metrics["non_black_ratio"] > 0.05`）；
   - 在缺乏实体存在性探测、剧情进度检查或战斗伤害日志校验的情况下，地图哪怕加载白模或空场景，该断言依然可以通过，无法有效验证从序章到终章的通关可用性；
   - Tier 3 的 12 个正交并发用例中，有 10 个用例在触控注入后未进行任何状态对比（例如武器切换是否生效、开火是否消耗弹药、下蹲视线高度是否保持低矮），丧失了并发防御验证的实际效能。

3. **从观察 1.3 深入推导图像解码器边界风险**：
   - PNG 规范中，大多数压缩编码器在生成实际截屏时会根据扫描行像素梯度自动选用 Sub、Up、Average 或 Paeth 差分滤波算法；
   - `ArtifactVerifier` 略过了滤波逆运算步骤，当处理未滤波数据（Filter 0，如当前的 Mock 构造图）时表现正常，但一旦接入真机生成的差分滤波 PNG，解析得到的像素矩阵会出现数值错位，导致工控配色与直方图比例产生严重误判。

4. **从观察 1.3 肯定基础通信与拓扑架构的设计合规性**：
   - 物理触控的坐标映射变换公式严格对应 480x960 物理屏幕和 960x266 视口，107 像素的居中偏移计算准确；
   - XRCON 的 12 字节固定帧头、魔数以及 TCP 发送端关闭释放机制完全符合引擎既定通信标准；
   - 设备层通过包裹输出提取退出码的机制解决了 PenOS 环境丢失远程 Shell 返回码的技术限制。

---

## 3. Caveats (注意条件与限制)

1. **硬件多指触控并发限制**：硬件触控驱动 `fts_ts` 在硬件物理层提供 2 个触控槽位（Slot 0 与 Slot 1）。对于需要三指并发的操作，测试套件采用分时交替与状态锁存机制是合理的物理折衷，重点在于必须对各动作产生的实际游戏状态（弹药、视高、速度）补充真实断言。
2. **真机战役关卡耗时**：真实战役中的大型地图（如 `c2a5` 与 `c5a1`）首次加载可能需要数秒时间，真实执行时需结合 XRCON `status` 轮询加载完毕状态，再执行后续剧情判定。

---

## 4. Conclusion (审查结论与门禁判词)

### 审查结论：REQUEST_CHANGES (要求整改)

### 核心发现清单：

#### 1. [Critical] INTEGRITY VIOLATION：存在 79 个空桩与虚假断言测试用例
- **位置**：`/Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py`
- **问题**：56 个用例仅包含 `ctx.assert_true(True)`，23 个用例仅注入操作而无状态比对，虚构了 100% 的高覆盖率假象。
- **整改建议**：
  - 针对 Tier 1 中的基础功能（如 `test_t1_05_04` 静止大跳），加入实际位移矢量判定（`ctx.assert_greater(pos_after['x'] - pos_before['x'], 0)`）；
  - 针对 Tier 3 跨功能并发，加入武器切换前后 ID 比对、开火扣弹量核验及下蹲视高断言；
  - 针对 Tier 2 边界用例，补充真实的异常捕获或参数边界校验。

#### 2. [Major] Tier 4 战役场景断言空泛，未覆盖通关目标
- **位置**：`test_t4_01` ~ `test_t4_05`（第 1280-1316 行）
- **问题**：仅执行换图并检测非黑像素比率 > 0.05，未校验关卡实体、剧情进度或通关标志。
- **整改建议**：增加基于 XRCON 或控制台日志的关卡实体与剧本事件状态查询，确保 Barney 对话、反共振灾变以及 Nihilanth 战败事件得到真实校验。

#### 3. [Major] PNG 解码器缺失 Scanline 滤波反变换
- **位置**：`ArtifactVerifier.parse_png`（第 122-136 行）
- **问题**：忽略 RFC 2083 定义的 1~4 类滤波还原，直接按原始字节读取，无法正确处理真机差分滤波截图。
- **整改建议**：补全标准 PNG 5 种行滤波逆运算（None, Sub, Up, Average, Paeth），确保真机截图像素颜色分析准确。

---

## 5. Verification Method (独立复核方法)

任何审计人员可通过以下操作复现本审查发现：

1. **复现空桩与无判定统计**：
   ```bash
   python3 -c "
   import ast
   with open('/Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py') as f:
       tree = ast.parse(f.read())
   funcs = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name.startswith('test_')]
   trivial = []
   for fn in funcs:
       src = ast.unparse(fn)
       real_asserts = [l for l in src.splitlines() if 'assert_' in l and 'assert_true(True)' not in l]
       if not real_asserts:
           trivial.append(fn.name)
   print(f'Total tests: {len(funcs)}, Trivial tests without real assertion: {len(trivial)}')
   "
   ```
   - **判定依据**：输出显示总测试 127 例，无真实断言测试为 79 例。

2. **验证测试运行器执行行为**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
   - **判定依据**：观察控制台虽然显示全部通过且退出码为 0，但对照源码即可确认大量用例因 `assert_true(True)` 而未经验证直接放行。
