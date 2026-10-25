# 词典笔底层逆向与反编译探索脚本集 (Research Scripts)

本目录收录了在对网易有道词典笔 X6 Pro 的 Falcon 引擎、QuickJS 字节码（`.js.bin`）、系统播放器底层动态库（`libfalcon.so`、`libjsapi_player.so`）进行深度逆向与排查时编写的专用分析脚本。

## 脚本分类说明

### 1. 字节码原子与常量池检索 (`dump_*_atoms.py`, `find_*_atoms.py`)
- `dump_all_player_atoms.py` / `dump_args_atoms.py`：遍历 QuickJS 模块头与原子定义表。
- `find_8700_atoms.py` / `find_status_atoms.py` / `search_bv_atoms.py`：定位字符串与指令在二进制字节码中的精确偏移。

### 2. 字节码指令反汇编与函数解析 (`disasm_*.py`, `precise_disasm.py`)
- `disasm_helper.py` / `precise_disasm.py`：按 QuickJS OpCode 映射表逐条反汇编字节码指令序列。
- `disasm_87cb.py` / `disasm_open_fail.py`：针对报错 PC 地址（如 `87cb` 处非法跳转）进行局部切片分析。

### 3. 函数与方法表定位 (`find_funcs.py`, `find_containing_func.py`)
- `find_funcs.py`：提取字节码中定义的所有内部函数与入口。
- `find_vue_methods.py` / `dump_vue_data_fn.py`：解析 Falcon-Vue 组件中绑定的 methods 与 data 函数。

### 4. 底层导出与 GStreamer 管道探测 (`dump_player_exports.py`, `dump_gst_strings.py`)
- `dump_player_exports.py`：导出 `libjsapi_player.so` 中注册的 JS 原生绑定方法（如 `probe`、`open`、`play`、`stop`、`seek` 等）。
- `dump_gst_strings.py`：提取动态库中内嵌的 GStreamer 管道初始化字符串。
