import contextlib
import io
from pathlib import Path
import shlex
import sys
import tempfile
import unittest
import zipfile

import pack_assets


def commands(path):
    return [shlex.split(line, comments=True) for line in path.read_text().splitlines()
            if line.strip() and not line.lstrip().startswith('//')]


class ControlsPackageTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        steam = self.root / 'steam'
        (steam / 'valve' / 'maps').mkdir(parents=True)
        (steam / 'valve' / 'maps' / 'c0a0.bsp').write_bytes(b'map fixture')
        prebuilt = self.root / 'engine'
        (prebuilt / 'valve').mkdir(parents=True)
        with zipfile.ZipFile(prebuilt / 'valve' / 'extras.pk3', 'w') as archive:
            archive.writestr('fixture', b'')
        self.target = self.root / 'output'
        old = pack_assets.STEAM_DIR, pack_assets.PREBUILT_DIR, pack_assets.TARGET_DIR
        self.addCleanup(self.restore, old)
        pack_assets.STEAM_DIR = str(steam)
        pack_assets.PREBUILT_DIR = str(prebuilt)
        pack_assets.TARGET_DIR = str(self.target)
        with contextlib.redirect_stdout(io.StringIO()):
            pack_assets.main()

    @staticmethod
    def restore(old):
        pack_assets.STEAM_DIR, pack_assets.PREBUILT_DIR, pack_assets.TARGET_DIR = old

    def test_packed_runtime_keeps_touch_enabled(self):
        entries = commands(self.target / 'autoexec.cfg')
        settings = {row[0]: row[1] for row in entries if len(row) == 2}
        self.assertEqual(settings.get('touch_enable'), '1')

    def test_pack_ships_all_referenced_config_files(self):
        for name in ('userconfig.cfg', 'touch.cfg', 'touch_numbers.cfg'):
            with self.subTest(name=name):
                self.assertTrue((self.target / name).is_file(), f'missing runtime config: {name}')

    def test_buttons_are_square_in_pixels_and_leave_hud_clear(self):
        path = self.target / 'touch.cfg'
        self.assertTrue(path.exists(), 'touch layout was not packed')
        buttons = [row for row in commands(path) if row[0] == 'touch_addbutton']
        actions = {row[3].split()[0] for row in buttons if row[3]}
        expected_actions = {
            '+jump', '+attack', '+attack2', '+reload', '+use', '_look',
            '_joy', '+duck', '+cjump', 'save', 'load'
        }
        self.assertTrue(expected_actions <= actions, f'missing required actions: {expected_actions - actions}')
        for row in buttons:
            x1, y1, x2, y2 = map(float, row[4:8])
            self.assertTrue(0 <= x1 < x2 <= 1 and 0 <= y1 < y2 <= 1, row[1])
            if row[2]:
                self.assertAlmostEqual((x2 - x1) * 960, (y2 - y1) * 266, delta=0.02, msg=row[1])
                self.assertLessEqual(y2 * 266, 216, row[1])
        foreground = [row for row in buttons if row[2] and row[3] != '']
        for index, first in enumerate(foreground):
            a = list(map(float, first[4:8]))
            for second in foreground[index + 1:]:
                b = list(map(float, second[4:8]))
                overlap = min(a[2], b[2]) > max(a[0], b[0]) and min(a[3], b[3]) > max(a[1], b[1])
                self.assertFalse(overlap, f'{first[1]} overlaps {second[1]}')

    def test_multitouch_screen_partition_and_concurrency_isolation(self):
        path = self.target / 'touch.cfg'
        self.assertTrue(path.exists(), 'touch layout was not packed')
        buttons = [row for row in commands(path) if row[0] == 'touch_addbutton']
        btn_map = {row[1]: row for row in buttons}

        # 左半屏 (0..0.26) 物理隔离虚拟摇杆与身法辅助按键
        left_buttons = ('joy', 'crouch', 'cjump')
        for name in left_buttons:
            self.assertIn(name, btn_map, f'missing left button: {name}')
            x1, y1, x2, y2 = map(float, btn_map[name][4:8])
            self.assertLessEqual(x2, 0.26, f'{name} must be within left partition (x2 <= 0.26)')

        # 右半屏视角控制与操作按键
        self.assertIn('look', btn_map)
        look_row = btn_map['look']
        self.assertGreaterEqual(float(look_row[4]), 0.26, 'look must start on right partition (x1 >= 0.26)')

        # 视角指针倒序扫描优先级验证：look 必须先于右侧核心战斗操作按键注册
        look_idx = buttons.index(look_row)
        for name in ('reload', 'alt_fire', 'fire', 'jump', 'use'):
            self.assertIn(name, btn_map)
            action_idx = buttons.index(btn_map[name])
            self.assertGreater(action_idx, look_idx, f'{name} must have reverse-order priority over look')

        # 身法按键槽位与锁存标志隔离
        self.assertEqual(btn_map['crouch'][3], '+duck 71')
        self.assertEqual(btn_map['crouch'][12], '4096')
        self.assertEqual(btn_map['jump'][3], '+jump 73')
        self.assertEqual(btn_map['cjump'][3], '+cjump')

        # userconfig.cfg 中大跳宏必须包含向前初速度注入与槽位 72
        userconfig_path = self.target / 'userconfig.cfg'
        self.assertTrue(userconfig_path.exists())
        uc_text = userconfig_path.read_text()
        self.assertIn('+forward', uc_text)
        self.assertIn('+jump 72', uc_text)
        self.assertIn('+duck 72', uc_text)

    def test_persistent_configs_do_not_start_a_second_map(self):
        for name in ('autoexec.cfg', 'userconfig.cfg'):
            path = self.target / name
            self.assertTrue(path.exists(), f'missing {name}')
            for row in commands(path):
                self.assertNotIn(row[0], ('map', 'load', 'changelevel'))


if __name__ == '__main__':
    unittest.main()
