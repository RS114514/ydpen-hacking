# Progress — M1: 触控系统虚拟摇杆与防抢占重构

Last visited: 2026-11-15T15:31:00Z

## Status
- [x] 初始化环境与读取规约及调研报告
- [x] 任务 1：定位并修复 `in_touch.c` 中 `Touch_ButtonPress` 的按键穿透与视角抢占缺陷
  - `event_down` 分支中命中 `touch_command` 与 `touch_wheel` 后增加 `break;`
  - `event_up` 分支中释放 `touch_command` 与 `touch_wheel` 后增加 `break;`
- [x] 任务 2：重构 `assets/valve/touch.cfg` 与 `dist_assets/valve/touch.cfg` 虚拟摇杆配置
  - 命名为 `joy`，动作 `_joy`，贴图 `gfx/touch/stick_ring`
  - 属性标志位 2048 (`TOUCH_FL_STICK`)
  - 坐标 `0.040000 0.220000 0.200708 0.800000`（像素 154.28x154.28，下边沿 212.8 满足 HUD 避让与正方形像素比）
  - 同步贴图文件至 `assets/valve/gfx/touch/` 与 `dist_assets/valve/gfx/touch/`
- [x] 任务 3：同步调整 `tools/test_controls.py` 断言并执行本地测试套件验证
  - 同步 `expected_actions` 包含 `_joy`
  - 同步 `left_buttons` 包含 `joy`
  - 消除 `test_xrcon.py` 在宿主机非阻塞等待时可能出现的日志读取时序竞争
  - 运行全量测试验证（`test_controls.py`, `test_xrcon.py`, `test_lifecycle.mjs`, `test_e2e_verification.py --self-test`, `build_amr.py`）全量 100% 通过
- [x] 编写最终交付报告 `handoff.md`
