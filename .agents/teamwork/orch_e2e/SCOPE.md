# Scope: E2E Testing Track

## Architecture
- **测试理念**：黑盒需求驱动（Opaque-box, Requirement-driven）。测试用例基于 `ORIGINAL_REQUEST.md` 与对外行为规格设计，独立于内部实现细节。
- **目标设备**：网易有道词典笔 6 代（序列号：`9DA2200007506350`）。测试命令与 ADB 操作必须显式携带 `-s 9DA2200007506350`。
- **核心交互通道**：
  1. 触控与手势注入：结合 `test_runner_core.py` 物理映射算法与真机 `/userdisk/doom/tap_mt`、`/bin/swipe` 注入 `/dev/input/event1`。
  2. 控制台指令通道：通过 UDP 套接字向 `127.0.0.1:27000` XRCON 发送控制台命令（如 `map <mapname>`, `save quick`, `load quick`）。
  3. 真实截图校验：通过真机 `miniapp_cli capture <remote_path>` 进行无损 PNG 截屏拉取并归档。
  4. 应用与进程生命周期管理：通过 `miniapp_cli start 8002026110400001` 与 `pidof xash3d` 状态监测。

## Feature Inventory
| # | Feature | 对应需求 | Tier 1 数量 | Tier 2 数量 | Tier 3 覆盖 | Tier 4 覆盖 |
|---|---------|----------|------------|------------|------------|------------|
| 1 | 启动死锁修复与动态库隔离 | R1 | 5 | 5 | ✓ | ✓ |
| 2 | 全屏直启与纯原生 mini APP | R1, 追加指令 2 | 5 | 5 | ✓ | ✓ |
| 3 | 官方原版高清 Lambda 图标 | 追加指令 1 | 5 | 5 | ✓ | ✓ |
| 4 | 全套触控按键完整覆盖 | R2 | 5 | 5 | ✓ | ✓ |
| 5 | 向前大跳无向后异常 | R2 | 5 | 5 | ✓ | ✓ |
| 6 | 多点触控并发防冲突 | R2 | 5 | 5 | ✓ | ✓ |
| 7 | NPC 身体前倾趴地姿态修复 | R3 | 5 | 5 | ✓ | ✓ |
| 8 | 黑橙工控风居中暂停菜单 | R4 | 5 | 5 | ✓ | ✓ |
| 9 | Save/Load 存读档可靠性 | R4 | 5 | 5 | ✓ | ✓ |
| 10 | 全流程 105 个关卡完整性 | R5 | 5 | 5 | ✓ | ✓ |
| 11 | 真机端到端自动化测试链路 | R6 | 5 | 5 | ✓ | ✓ |

## Test Tiers Definition
- **Tier 1 (功能覆盖 >= 55)**：隔离验证 11 个特性的基本正常行为（每个特性 >= 5 个独立用例）。
- **Tier 2 (边界与异常 >= 55)**：极值测试、空输入、手电与下蹲反复锁存、快速多击大跳、高频存读档、关卡极端跳转等（每个特性 >= 5 个独立用例）。
- **Tier 3 (跨功能组合交互 >= 11)**：两两正交组合（如：移动+转视角、移动+跳跃+开火、下蹲移动+手电、存读档+地图切换、大跳+切枪）。
- **Tier 4 (真实战役场景 >= 5)**：
  1. 序章轨道车运行与黑山基地入门（`c0a0` 序列）。
  2. 异常物质实验室事故与科学家/保安救援互动（`c1a0` 序列）。
  3. 地表张力军方激战与重火力交互（`c2a5` 序列）。
  4. Xen 外星异域低重力跳跃推进（`c4a1` 序列）。
  5. 最终 Boss Nihilanth 首领战全流程加载与胜利判定（`c5a1`）。

## Deliverables
1. `TEST_INFRA.md`：位于 `/Volumes/500GB/Ydpen/halflife_app/TEST_INFRA.md` 与 `/Volumes/500GB/Ydpen/TEST_INFRA.md`。
2. 自动化测试套件：位于 `/Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py`。
3. `TEST_READY.md`：位于 `/Volumes/500GB/Ydpen/TEST_READY.md`。
