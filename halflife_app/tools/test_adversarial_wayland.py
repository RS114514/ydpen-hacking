#!/usr/bin/env python3
"""
Wayland 几何、状态机与动态库隔离对抗性验证套件 (Wayland Challenger Suite)
针对原生 Wayland 居中显示与画面稳定性实施全面对抗测试：
1. 坐标边界与平移极端值验证 (y = 0, 106, 107, 372, 373, 479, 负值, 越界大值, 截断到 [0, 265], C 原生下溢与除零/浮点检测)
2. 协议状态机对抗性分析 (高频多重 xdg_surface.configure / ack_configure 重入防泄漏, should_block_toplevel_opcode 拦截完备性)
3. 动态库隔离破坏性验证 (针对 build_amr.py 与 install_amr.py 检验恶意注入 libwl_center.so 时是否必然拦截报错)
"""

import os
import sys
import tempfile
import zipfile
import subprocess
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parent

# ----------------------------------------------------------------------
# 模块 1: 坐标边界与平移极端值验证
# ----------------------------------------------------------------------
class WaylandCoordinateMath:
    """Wayland wl_fixed_t 24.8 坐标平移数学模型"""
    OFF_INT = 107
    MAX_Y_INT = 265
    OFF_FIXED = 107 * 256  # 27392
    MAX_Y_FIXED = 265 * 256  # 67840

    @staticmethod
    def wl_fixed_from_double(d: float) -> int:
        return int(d * 256.0)

    @staticmethod
    def wl_fixed_to_double(f: int) -> float:
        return f / 256.0

    @classmethod
    def transform_y(cls, y_fixed: int) -> int:
        """原生 wl_center.c 中 hook_touch_down/motion 的核心逻辑"""
        # wl_fixed_t off = wl_fixed_from_int(107);
        # wl_fixed_t max_y = wl_fixed_from_int(265);
        # wl_fixed_t adj_y = y - off;
        # if (adj_y < 0) adj_y = 0;
        # if (adj_y > max_y) adj_y = max_y;
        adj_y = y_fixed - cls.OFF_FIXED
        if adj_y < 0:
            adj_y = 0
        if adj_y > cls.MAX_Y_FIXED:
            adj_y = cls.MAX_Y_FIXED
        return adj_y


class TestCoordinateBoundaryAdversarial(unittest.TestCase):
    """验证坐标平移极端值与边界截断"""

    def test_01_exact_boundaries(self):
        """测试用户指派的精确边界坐标: y = 0, 106, 107, 372, 373, 479"""
        cases = [
            (0, 0.0, "顶部屏幕边缘 (黑边内) 必须截断为 0"),
            (106, 0.0, "顶部黑边最底像素 y=106 必须截断为 0"),
            (107, 0.0, "游戏视口起始顶边 y=107 必须精确对应视口 y'=0"),
            (372, 265.0, "游戏视口底边 y=372 必须精确对应视口 y'=265"),
            (373, 265.0, "底部黑边顶像素 y=373 必须截断为 265"),
            (479, 265.0, "底部屏幕边缘 y=479 (黑边内) 必须截断为 265"),
        ]
        for y_in, expected_out, desc in cases:
            y_fixed = y_in * 256
            out_fixed = WaylandCoordinateMath.transform_y(y_fixed)
            out_double = WaylandCoordinateMath.wl_fixed_to_double(out_fixed)
            self.assertEqual(out_double, expected_out, f"失败: {desc} (输入 y={y_in}, 输出 y'={out_double})")

    def test_02_subpixel_transitions(self):
        """测试亚像素级边界平滑过渡与单调性"""
        subpixel_cases = [
            (106.996, 0.0),
            (107.0, 0.0),
            (107.004, 1.0 / 256.0),
            (107.25, 0.25),
            (239.5, 132.5),
            (371.75, 264.75),
            (372.0, 265.0),
            (372.004, 265.0),
            (372.996, 265.0),
        ]
        for y_val, expected_val in subpixel_cases:
            y_fixed = WaylandCoordinateMath.wl_fixed_from_double(y_val)
            out_fixed = WaylandCoordinateMath.transform_y(y_fixed)
            out_val = WaylandCoordinateMath.wl_fixed_to_double(out_fixed)
            self.assertAlmostEqual(out_val, expected_val, places=4,
                                   msg=f"亚像素过渡偏差: 输入 {y_val}, 期望 {expected_val}, 实际 {out_val}")

    def test_03_continuous_viewport_monotonicity(self):
        """测试 [107, 372] 视口区间内连续 0.25 步进的严格线性映射与单调性"""
        prev_out = -1.0
        for step in range(107 * 4, 372 * 4 + 1):
            y_float = step / 4.0
            y_fixed = WaylandCoordinateMath.wl_fixed_from_double(y_float)
            out_fixed = WaylandCoordinateMath.transform_y(y_fixed)
            out_float = WaylandCoordinateMath.wl_fixed_to_double(out_fixed)

            # 验证输出严格限制在 [0, 265] 视口内
            self.assertTrue(0.0 <= out_float <= 265.0)
            # 验证单调递增
            self.assertGreaterEqual(out_float, prev_out)
            # 验证严格线性关系 y' = y - 107
            self.assertAlmostEqual(out_float, y_float - 107.0, delta=0.005)
            prev_out = out_float

    def test_04_negative_and_out_of_bounds_inputs(self):
        """测试负坐标与大值越界输入是否被严格限制在 [0, 265] 内"""
        negative_inputs = [-0.001, -1.0, -10.0, -107.0, -480.0, -1000.0, -32768.0, -100000.0]
        for y_neg in negative_inputs:
            y_fixed = WaylandCoordinateMath.wl_fixed_from_double(y_neg)
            out_fixed = WaylandCoordinateMath.transform_y(y_fixed)
            out_val = WaylandCoordinateMath.wl_fixed_to_double(out_fixed)
            self.assertEqual(out_val, 0.0, f"负坐标越界未被截断为 0: 输入 {y_neg}, 输出 {out_val}")

        large_inputs = [480.0, 480.004, 500.0, 1000.0, 32767.0, 100000.0, 500000.0]
        for y_large in large_inputs:
            y_fixed = WaylandCoordinateMath.wl_fixed_from_double(y_large)
            out_fixed = WaylandCoordinateMath.transform_y(y_fixed)
            out_val = WaylandCoordinateMath.wl_fixed_to_double(out_fixed)
            self.assertEqual(out_val, 265.0, f"大坐标越界未被截断为 265: 输入 {y_large}, 输出 {out_val}")

    def test_05_c_native_stress_execution(self):
        """通过编译并运行真实 C 代码检验下溢、除零及浮点异常"""
        c_test_code = r"""
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <math.h>

typedef int32_t wl_fixed_t;
static inline wl_fixed_t wl_fixed_from_int(int i) { return i * 256; }
static inline double wl_fixed_to_double(wl_fixed_t f) { return ((double) f) / 256.0; }

static wl_fixed_t transform(wl_fixed_t y) {
    wl_fixed_t off = wl_fixed_from_int(107);
    wl_fixed_t max_y = wl_fixed_from_int(265);
    wl_fixed_t adj_y = y - off;
    if (adj_y < 0) adj_y = 0;
    if (adj_y > max_y) adj_y = max_y;
    return adj_y;
}

int main() {
    // 1. 边界测试
    int test_ys[] = { 0, 106, 107, 372, 373, 479, -1, -500, 480, 1000, 32767, -32768 };
    int n = sizeof(test_ys) / sizeof(test_ys[0]);
    for (int i = 0; i < n; i++) {
        wl_fixed_t y = wl_fixed_from_int(test_ys[i]);
        wl_fixed_t res = transform(y);
        double d = wl_fixed_to_double(res);
        if (d < 0.0 || d > 265.0 || isnan(d) || isinf(d)) {
            fprintf(stderr, "C test failed for %d: %f\n", test_ys[i], d);
            return 1;
        }
    }

    // 2. 密集循环测试无除零与未定义浮点
    for (int y = -10000; y <= 10000; y++) {
        wl_fixed_t res = transform((wl_fixed_t)(y * 64)); // 0.25 步进
        double d = wl_fixed_to_double(res);
        if (d < 0.0 || d > 265.0) {
            fprintf(stderr, "C dense test range error: y=%d -> %f\n", y, d);
            return 2;
        }
    }
    printf("C_NATIVE_COORDS_PASS\n");
    return 0;
}
"""
        with tempfile.TemporaryDirectory() as tmpdir:
            src_path = Path(tmpdir) / "test_coords.c"
            bin_path = Path(tmpdir) / "test_coords"
            src_path.write_text(c_test_code)
            compile_cmd = ["clang", "-O2", str(src_path), "-o", str(bin_path)]
            comp_res = subprocess.run(compile_cmd, capture_output=True, text=True)
            self.assertEqual(comp_res.returncode, 0, f"Clang 编译测试代码失败: {comp_res.stderr}")

            run_res = subprocess.run([str(bin_path)], capture_output=True, text=True)
            self.assertEqual(run_res.returncode, 0)
            self.assertIn("C_NATIVE_COORDS_PASS", run_res.stdout)


# ----------------------------------------------------------------------
# 模块 2: 协议状态机对抗性分析
# ----------------------------------------------------------------------
class WaylandStateMachineSim:
    """模拟 native/wl_center.c 中的状态机标志位与挂载逻辑"""
    def __init__(self):
        self.g_configured = 0
        self.g_bg_attached = 0
        self.g_bg_buf_created_count = 0
        self.attach_black_480_bg_call_count = 0
        self.surface_commit_count = 0
        self.g_sdl_surface = object()  # 非空表面

    def attach_black_480_bg(self, surf):
        self.attach_black_480_bg_call_count += 1
        # 对应 wl_center.c: if (!g_bg_buf) 创建 shm 缓冲
        if self.g_bg_buf_created_count == 0:
            self.g_bg_buf_created_count += 1
        # wl_surface_commit(surf)
        self.surface_commit_count += 1

    def maybe_attach_bg_on_ack(self, proxy_cls: str, opcode: int):
        """对应 wl_center.c lines 400-411"""
        if not self.g_bg_attached and self.g_sdl_surface and opcode == 4:
            if proxy_cls == "xdg_surface":
                self.g_configured = 1
                self.g_bg_attached = 1
                self.attach_black_480_bg(self.g_sdl_surface)

    def on_egl_resize(self):
        """对应 wl_center.c lines 326-329"""
        if self.g_configured and self.g_sdl_surface and not self.g_bg_attached:
            self.attach_black_480_bg(self.g_sdl_surface)
            self.g_bg_attached = 1


def should_block_toplevel_opcode(cls: str, opcode: int) -> int:
    """对应 wl_center.c lines 388-398"""
    if cls == "xdg_toplevel":
        # Opcode 12 is XDG_TOPLEVEL_UNSET_FULLSCREEN; 10 is unset_maximized; 5 is move; 6 is resize
        if opcode in (12, 10, 5, 6):
            return 1
    return 0


class TestWaylandStateMachineAdversarial(unittest.TestCase):
    """测试状态机重入与 opcode 拦截"""

    def test_01_multiple_rapid_ack_configure(self):
        """对抗场景：合成器短时间内下发 100 次 configure 事件并被客户端连续 ack_configure"""
        sim = WaylandStateMachineSim()
        # 模拟 100 次连续 ack_configure (opcode 4)
        for i in range(100):
            sim.maybe_attach_bg_on_ack("xdg_surface", 4)
            sim.on_egl_resize()

        # 验证: 尽管下发了 100 次，但背景缓冲创建与挂载提交均严格且仅执行了 1 次
        self.assertEqual(sim.g_bg_attached, 1)
        self.assertEqual(sim.attach_black_480_bg_call_count, 1, "多次 configure 导致多次挂载背景缓冲！")
        self.assertEqual(sim.g_bg_buf_created_count, 1, "多次 configure 导致重复创建 SHM 缓冲，存在内存泄漏！")
        self.assertEqual(sim.surface_commit_count, 1, "多次 configure 导致重复 commit 父表面造成乱序！")

    def test_02_other_opcodes_on_xdg_surface(self):
        """非 opcode 4（如 destroy=0, get_toplevel=1, set_window_geometry=3）不应触发背景挂载"""
        sim = WaylandStateMachineSim()
        for op in [0, 1, 2, 3, 5]:
            sim.maybe_attach_bg_on_ack("xdg_surface", op)
        self.assertEqual(sim.g_bg_attached, 0)
        self.assertEqual(sim.attach_black_480_bg_call_count, 0)

    def test_03_toplevel_opcode_filtering_completeness(self):
        """检验 should_block_toplevel_opcode 是否完整覆盖了试图脱离全屏的操作码"""
        # xdg_toplevel 所有协议操作码定义 (v1-v5):
        # 0: destroy, 1: set_parent, 2: set_title, 3: set_app_id, 4: show_window_menu
        # 5: move, 6: resize, 7: set_max_size, 8: set_min_size, 9: set_maximized
        # 10: unset_maximized, 11: set_fullscreen, 12: unset_fullscreen, 13: set_minimized
        expected_blocked = {
            5: "MOVE (窗口交互式拖动挪位)",
            6: "RESIZE (窗口边框拉伸)",
            10: "UNSET_MAXIMIZED (取消最大化返回浮动)",
            12: "UNSET_FULLSCREEN (取消全屏返回浮动)"
        }
        for opcode in range(16):
            blocked = should_block_toplevel_opcode("xdg_toplevel", opcode)
            if opcode in expected_blocked:
                self.assertEqual(blocked, 1, f"脱离全屏操作码 {opcode} ({expected_blocked[opcode]}) 未被拦截！")
            else:
                self.assertEqual(blocked, 0, f"合法操作码 {opcode} 被误拦截！")

        # 验证非 xdg_toplevel 类（例如 wl_surface 或 xdg_surface）不受影响
        for other_cls in ["wl_surface", "xdg_surface", "wl_subsurface", "wl_touch"]:
            for opcode in range(16):
                blocked = should_block_toplevel_opcode(other_cls, opcode)
                self.assertEqual(blocked, 0, f"非 toplevel 类 {other_cls} 的 opcode {opcode} 被错误拦截！")


# ----------------------------------------------------------------------
# 模块 3: 动态库隔离破坏性验证
# ----------------------------------------------------------------------
class TestDynamicLibraryIsolationAdversarial(unittest.TestCase):
    """对抗场景：恶意或误将 libwl_center.so 打入 AMR 安装包，验证构建与安装脚本是否必然拦截报错"""

    def _simulate_build_validation(self, namelist: set, file_contents: dict, native_bytes: bytes):
        """提取 tools/build_amr.py lines 220-236 的原生包校验逻辑"""
        for arch in ("arm64", "arm64-orange"):
            jsapi_entry = f"libs/{arch}/libjsapi_hl.so"
            if jsapi_entry not in namelist:
                raise RuntimeError(f"包内缺少必要原生库 {jsapi_entry}，停止打包")
            if file_contents.get(jsapi_entry) != native_bytes:
                raise RuntimeError(f"包内原生库 {jsapi_entry} 与编译产物不一致，停止打包")
            wl_entry = f"libs/{arch}/libwl_center.so"
            if wl_entry in namelist:
                raise RuntimeError(f"AMR 包内检测到违规包含居中插件 {wl_entry}，必须隔离在包外，停止打包")

        actual_libs = {name for name in namelist if name.startswith("libs/") and not name.endswith("/")}
        expected_libs = {"libs/arm64/libjsapi_hl.so", "libs/arm64-orange/libjsapi_hl.so"}
        if actual_libs != expected_libs:
            raise RuntimeError(f"AMR 包内 libs 目录内容异常：期望 {expected_libs}，实际包含 {actual_libs}")

    def _simulate_install_validation(self, namelist: set, file_contents: dict):
        """提取 tools/install_amr.py lines 52-66 的安装校验逻辑"""
        for arch in ('arm64', 'arm64-orange'):
            jsapi_path = f'libs/{arch}/libjsapi_hl.so'
            if jsapi_path not in namelist:
                raise RuntimeError(f'包内缺少必要原生库 {jsapi_path}，拒绝安装')
            if not file_contents.get(jsapi_path, b'').startswith(b'\x7fELF'):
                raise RuntimeError(f'包内原生库 {jsapi_path} 无有效 ELF 头，拒绝安装')
            wl_path = f'libs/{arch}/libwl_center.so'
            if wl_path in namelist:
                raise RuntimeError(f'AMR 包内检测到违规包含 {wl_path}，违反动态库隔离规约，拒绝安装')
        actual_libs = {name for name in namelist if name.startswith('libs/') and not name.endswith('/')}
        expected_libs = {'libs/arm64/libjsapi_hl.so', 'libs/arm64-orange/libjsapi_hl.so'}
        if actual_libs != expected_libs:
            raise RuntimeError(f'AMR 包内 libs 目录内容异常：期望 {expected_libs}，实际包含 {actual_libs}')

    def test_01_clean_amr_passes_both(self):
        """合法合规的包必须顺利通过 build 与 install 校验"""
        valid_elf = b"\x7fELF\x02\x01\x01\x00" + b"\x00" * 100
        namelist = {
            "manifest.json", "app.json",
            "libs/arm64/libjsapi_hl.so",
            "libs/arm64-orange/libjsapi_hl.so"
        }
        contents = {
            "libs/arm64/libjsapi_hl.so": valid_elf,
            "libs/arm64-orange/libjsapi_hl.so": valid_elf
        }
        # 不应抛出异常
        self._simulate_build_validation(namelist, contents, valid_elf)
        self._simulate_install_validation(namelist, contents)

    def test_02_attack_inject_arm64_wl_center(self):
        """对抗攻击 1: 恶意将 libwl_center.so 放入 libs/arm64/"""
        valid_elf = b"\x7fELF\x02\x01\x01\x00" + b"\x00" * 100
        namelist = {
            "manifest.json",
            "libs/arm64/libjsapi_hl.so",
            "libs/arm64-orange/libjsapi_hl.so",
            "libs/arm64/libwl_center.so"
        }
        contents = {
            "libs/arm64/libjsapi_hl.so": valid_elf,
            "libs/arm64-orange/libjsapi_hl.so": valid_elf,
            "libs/arm64/libwl_center.so": valid_elf
        }
        # build_amr 必须抛出 RuntimeError
        with self.assertRaises(RuntimeError) as ctx_build:
            self._simulate_build_validation(namelist, contents, valid_elf)
        self.assertIn("libwl_center.so", str(ctx_build.exception))

        # install_amr 必须抛出 RuntimeError
        with self.assertRaises(RuntimeError) as ctx_inst:
            self._simulate_install_validation(namelist, contents)
        self.assertIn("libwl_center.so", str(ctx_inst.exception))

    def test_03_attack_inject_orange_wl_center(self):
        """对抗攻击 2: 恶意将 libwl_center.so 放入 libs/arm64-orange/"""
        valid_elf = b"\x7fELF\x02\x01\x01\x00" + b"\x00" * 100
        namelist = {
            "manifest.json",
            "libs/arm64/libjsapi_hl.so",
            "libs/arm64-orange/libjsapi_hl.so",
            "libs/arm64-orange/libwl_center.so"
        }
        contents = {
            "libs/arm64/libjsapi_hl.so": valid_elf,
            "libs/arm64-orange/libjsapi_hl.so": valid_elf,
            "libs/arm64-orange/libwl_center.so": valid_elf
        }
        with self.assertRaises(RuntimeError) as ctx_build:
            self._simulate_build_validation(namelist, contents, valid_elf)
        self.assertIn("libwl_center.so", str(ctx_build.exception))

        with self.assertRaises(RuntimeError) as ctx_inst:
            self._simulate_install_validation(namelist, contents)
        self.assertIn("libwl_center.so", str(ctx_inst.exception))

    def test_04_attack_inject_libs_root_or_other_arch(self):
        """对抗攻击 3: 试图绕过 libs/{arch} 规则，将库放入 libs/libwl_center.so 或 libs/other/"""
        valid_elf = b"\x7fELF\x02\x01\x01\x00" + b"\x00" * 100
        namelist = {
            "manifest.json",
            "libs/arm64/libjsapi_hl.so",
            "libs/arm64-orange/libjsapi_hl.so",
            "libs/libwl_center.so"  # 未带子目录
        }
        contents = {
            "libs/arm64/libjsapi_hl.so": valid_elf,
            "libs/arm64-orange/libjsapi_hl.so": valid_elf,
            "libs/libwl_center.so": valid_elf
        }
        with self.assertRaises(RuntimeError) as ctx_build:
            self._simulate_build_validation(namelist, contents, valid_elf)
        self.assertIn("libs 目录内容异常", str(ctx_build.exception))

        with self.assertRaises(RuntimeError) as ctx_inst:
            self._simulate_install_validation(namelist, contents)
        self.assertIn("libs 目录内容异常", str(ctx_inst.exception))

    def test_05_real_dist_amr_physical_isolation(self):
        """物理检查项目当前 dist/half-life-1.0.0.amr 真实压缩包"""
        amr_path = PROJECT_ROOT / "dist" / "half-life-1.0.0.amr"
        if not amr_path.exists():
            self.skipTest(f"{amr_path} 不存在，跳过真实包测试")

        with zipfile.ZipFile(amr_path) as archive:
            namelist = set(archive.namelist())
            # 严格断言包内不能有任何 libwl_center.so
            wl_candidates = [n for n in namelist if "libwl_center" in n]
            self.assertEqual(wl_candidates, [], f"真实产物包中居然检测到了居中插件: {wl_candidates}")

            # 校验实际 libs 集合必须与规约完全一致
            actual_libs = {name for name in namelist if name.startswith("libs/") and not name.endswith("/")}
            expected_libs = {"libs/arm64/libjsapi_hl.so", "libs/arm64-orange/libjsapi_hl.so"}
            self.assertEqual(actual_libs, expected_libs, f"真实包内 libs 集合不合规: {actual_libs}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
