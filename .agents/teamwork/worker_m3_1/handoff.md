# M3 里程碑交付报告：原生小应用打包部署与真机全量端到端测试验收

## 1. Observation
本轮任务在有道词典笔 6 代真机（ADB 序列号 `9DA2200007506350`）以及本地开发环境中执行，实际观测到的各项指标与数据如下：

1. **AMR 编译打包与动态库物理隔离**：
   - 执行构建命令：`python3 tools/build_amr.py`，生成安装包文件 `/Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr`（体积 126,216 字节）。
   - 包内文件清单核查：包含 14 个文件条目，其中 `libs/` 目录严格仅含 `libs/arm64/libjsapi_hl.so` 与 `libs/arm64-orange/libjsapi_hl.so`。
   - 动态库物理隔离核查：`zipfile.namelist()` 遍历确认不存在任何 `libwl_center.so`，消除了与 Falcon 主框架运行库之间的死锁隐患。

2. **真机部署与独立库注入**：
   - 执行部署命令：`python3 tools/install_amr.py`，全量安装到 6 代真机。
   - 配置文件自动化备份归档于真机 `/userdisk/halflife/valve/config-backup-20261116-041244-611617`。
   - 服务器游戏库 `hl.so`（MD5 一致性验证通过）推送至 `/userdisk/halflife/valve/dlls/hl.so`。
   - 高清触控贴图（包括十字键、摇杆外圈、摇杆中心及大跳按键）推送至 `/userdisk/halflife/valve/gfx/touch/`。
   - 拦截库独立推送：`/userdisk/halflife/libwl_center.so` 独立推送成功（文件大小 54,832 字节，真机 MD5 为 `6624eeb08ae0b10862f1068be72c5751`）。
   - 小应用安装：真机 `miniapp_cli install` 返回 `{"appid": "8002026110400001", "ret": 0}`。

3. **本地回归测试套件全绿通过**：
   - `python3 tools/test_controls.py`：5 项用例全部通过，耗时 0.089s，退出代码 0。
   - `node tools/test_lifecycle.mjs`：3 项用例全部通过，耗时 829ms，退出代码 0。
   - `python3 tools/test_xrcon.py`：17 项用例全部通过，耗时 19.288s，退出代码 0。

4. **真机端到端全量 127 项测试执行结果**：
   - 执行指令：`python3 tools/test_e2e_verification.py --serial 9DA2200007506350`。
   - 结果摘要：
     - 总用例数：127
     - 通过数：127
     - 失败数：0
     - 超时数：0
     - 通过率：100.0%
     - 进程退出代码：0
   - 各分层执行情况：
     - Tier 1（基础功能覆盖 TC-E2E-T1-01-01 ~ T1-11-05）：55/55 通过 (100.0%)
     - Tier 2（边界与异常防御 TC-E2E-T2-01-01 ~ T2-11-05）：55/55 通过 (100.0%)
     - Tier 3（跨功能正交组合 TC-E2E-T3-01 ~ T3-12）：12/12 通过 (100.0%)
     - Tier 4（战役全流程通关场景 TC-E2E-T4-01 ~ T4-05）：5/5 通过 (100.0%)
   - 结构化产物路径：
     - JSON 汇总报告：`/Volumes/500GB/Ydpen/halflife_app/test_artifacts/run_20261116_042025/summary.json`
     - Markdown 详报：`/Volumes/500GB/Ydpen/halflife_app/test_artifacts/run_20261116_042025/REPORT.md`
     - 截图证据集：全部 127 项关联的真实真机图像均留存在该运行目录下。

## 2. Logic Chain
1. **启动阻塞与管道挂起排查**：
   - 观测到在 legacy ADB transport 下，执行 `miniapp_cli start` 会保持与前端会话连接未闭合，导致 stdout EOF 永远无法到达，阻塞父 shell 会话。
   - 解决方案：在 `DeviceEnv.run_cmd` 中检测 `miniapp_cli start`，通过 subshell `(nohup {command} >/dev/null 2>&1 &)` 彻底切断标准输出重定向并放入后台，使 ADB shell 能够瞬时返回真实退出代码 0，随后配合轮询检测 `pidof xash3d`，消除了启动阶段的看门狗超时。

2. **热启动与生命周期自愈排查**：
   - 在强杀 `xash3d` 场景中（TC-E2E-T2-01-04），上层 Falcon 前端组件如果未重新加载，则不会重复触发 `mounted`。
   - 解决方案：在 `src/root.js` 内部增加心跳检测定时器，周期性检测 `hl.isRunning()`，一旦发现底层引擎异常中断且非主动退出状态，立即自动调用 `launchGame()` 重新 fork 引擎实例，实现了进程级的故障恢复。

3. **双层架构截屏与色彩直方图分析**：
   - 观测到 `miniapp_cli capture` 在真机上抓取的是上层 DOM 图层，而真正的 3D 游戏画面与 UI 渲染在底层 Wayland DRM 图层中。
   - 解决方案：在 `capture_screen` 中引入自适应捕获逻辑：当检测到底层 `xash3d` 运行时，通过 TCP 27000 向引擎下发 XRCON `snapshot` 指令，取得 960x480 的 OpenGL 帧缓冲，裁剪居中 960x266 视口（去除上下各 107px 黑边），真实场景非黑像素比高达 59.8%；在暂停菜单场景中，准确反映居中工控橙面板（#F57E00）与上下黑色留白，使得几何尺寸、纯黑比例、工控橙比例及非黑比率全量满足断言。

## 3. Caveats
- 真机本地测试执行 `tools/test_xrcon.py` 时，需要确保宿主机 27000 端口未被 ADB forward 占用（若已被占用，需先调用 `adb forward --remove tcp:27000`）。
- 6 代真机在长时间运行 3D 渲染与连续换图时，电池电量会有所消耗，建议在持续测试时连接带供电的 USB Hub。

## 4. Conclusion
M3 里程碑设定的所有目标与技术规约已全部达成：
- AMR 打包成功，包内物理隔离动态库，无任何 `libwl_center.so` 污染；
- 6 代真机全量部署成功，`/userdisk/halflife/libwl_center.so` 独立注入并确认 ELF 与 MD5 准确；
- 3 项本地回归测试（`test_controls.py`、`test_lifecycle.mjs`、`test_xrcon.py`）100% 通过；
- 真机端到端自动化测试 127 项用例在 6 代真机上全量实测通过，通过率 100.0%，退出代码严格为 0。

## 5. Verification Method
可执行以下命令对本次交付成果进行独立无差别复现验证：

1. **AMR 动态库隔离静态核验**：
   ```bash
   python3 -c "import zipfile; z = zipfile.ZipFile('/Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr'); assert not any('libwl_center' in n for n in z.namelist()); print('AMR ISOLATION PASS')"
   ```
2. **设备端独立拦截库校验**：
   ```bash
   adb -s 9DA2200007506350 shell "file /userdisk/halflife/libwl_center.so && md5sum /userdisk/halflife/libwl_center.so"
   ```
3. **本地回归测试套件验证**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app
   python3 tools/test_controls.py
   node tools/test_lifecycle.mjs
   adb forward --remove tcp:27000 || true
   python3 tools/test_xrcon.py
   ```
4. **真机端到端全量自动化测试验收**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app
   python3 tools/test_e2e_verification.py --serial 9DA2200007506350
   ```
   期望结果：全部 127 项用例均显示 PASS，退出代码为 0。
