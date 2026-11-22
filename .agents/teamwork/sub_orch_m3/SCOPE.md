# Scope: M3 - 原生小应用打包部署与真机 9DA2200007506350 全量端到端验收

## Architecture
- Module boundaries:
  1. Packaging: `tools/build_amr.py`（使用指定 zig 编译器构建，exFAT 需先输出至 `/tmp/` 再复制，产出 `dist/half-life-1.0.0.amr`）
  2. Deployment: `tools/install_amr.py`（针对 6 代真机 9DA2200007506350，安装 AMR 并独立推送 `/userdisk/halflife/libwl_center.so`）
  3. Local Regression Suites: `test_controls.py`, `test_lifecycle.mjs`, `test_xrcon.py`
  4. Real-device E2E Test Suite: `tools/test_e2e_verification.py --serial 9DA2200007506350`（全量 127 项端到端测试用例，覆盖 Tier 1 到 Tier 4，全部必须在真机执行通过）

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 7 | Native AMR Build & Device Deployment | 使用 build_amr.py 编译打包并经 install_amr.py 部署至 6 代真机 9DA2200007506350 | M3 | ORIGINAL_REQUEST §R4 |
| 8 | Local & Device E2E Verification Full Pass | 本地回归脚本全部通过，真机端到端全量 127 项测试退出码 0 | M3 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 3.1 | Worker 打包部署与测试全量执行 | 编译打包 AMR、部署至真机 9DA2200007506350，运行本地回归脚本与真机 127 项 E2E 测试 | none | IN_PROGRESS |
| 3.2 | Reviewer 独立部署与测试日志审查 | 审查打包产物结构、真机部署日志及 127 项测试日志的完整性与真实性 | 3.1 | PLANNED |
| 3.3 | Challenger 对抗性真机鲁棒性验证 | 验证真机环境下重复重进、连续快速存读档及异常断连下的系统鲁棒性 | 3.1 | PLANNED |
| 3.4 | Auditor 独立真实性审计 | 司法级审计真机测试日志与 ADB 交互真实性，验证绝对无虚假 mock 或假测试 | 3.1 | PLANNED |
| 3.5 | 门禁决策与最终成果交付 | 门禁汇总与全绿判定，形成最终交付报告 | 3.2, 3.3, 3.4 | PLANNED |

## Interface Contracts & Constraints
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 `9DA2200007506350`），严禁对 3 代笔进行任何写入与操作。
- `build_amr.py` 打包产物严禁包含 `libs/{arch}/libwl_center.so`，必须保持动态库物理隔离。
- `install_amr.py` 必须成功推送到设备并在设备端完成解压与动态库注入配置。
- 所有本地与真机测试脚本退出码必须严格为 0。
