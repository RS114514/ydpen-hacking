#!/usr/bin/env python3
"""Adversarial Stress & Boundary Verification Test Suite for Milestone 1 (M1).

Validates:
1. Geometric boundaries, HUD margin (y2 <= 0.800000, y2 * 266 <= 216), deadband (x in 0.200708..0.260000).
2. Square pixel aspect ratios under micro-float perturbations (delta < 0.02 px).
3. Concurrency, break-isolation, event_up safety, latching, and precision flags.
4. Execution of the native compiled adversarial stress harness.
"""

import math
from pathlib import Path
import shlex
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
CFG_PATHS = [
    ROOT / 'assets' / 'valve' / 'touch.cfg',
    ROOT / 'dist_assets' / 'valve' / 'touch.cfg'
]
HARNESS_SRC = ROOT / 'tools' / 'adversarial_touch_harness.c'
HARNESS_BIN = ROOT / 'tools' / 'adversarial_touch_harness'


def parse_touch_buttons(cfg_path):
    buttons = []
    for line in cfg_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        tokens = shlex.split(line, comments=True)
        if tokens and tokens[0] == 'touch_addbutton':
            buttons.append({
                'name': tokens[1],
                'texture': tokens[2],
                'command': tokens[3],
                'x1': float(tokens[4]),
                'y1': float(tokens[5]),
                'x2': float(tokens[6]),
                'y2': float(tokens[7]),
                'r': int(tokens[8]),
                'g': int(tokens[9]),
                'b': int(tokens[10]),
                'a': int(tokens[11]),
                'flags': int(tokens[12]) if len(tokens) > 12 else 0
            })
    return buttons


class AdversarialGeometryAndBoundaryTests(unittest.TestCase):
    """Rigorous mathematical & boundary limits verification."""

    def setUp(self):
        self.buttons = parse_touch_buttons(CFG_PATHS[0])
        self.btn_map = {b['name']: b for b in self.buttons}

    def test_hud_clearance_and_margin(self):
        """Verify joy and all foreground controls do not invade HUD (y2 * 266 <= 216)."""
        joy = self.btn_map.get('joy')
        self.assertIsNotNone(joy, "Missing 'joy' virtual joystick in touch.cfg")

        # Joy bottom coordinate
        y2 = joy['y2']
        self.assertEqual(y2, 0.800000, f"Joy y2 must be exactly 0.800000, got {y2}")
        y2_px = y2 * 266.0
        self.assertAlmostEqual(y2_px, 212.8, places=4)
        self.assertLessEqual(y2_px, 216.0, "Joy lower edge must not exceed 216 px")

        # HUD safety margin
        margin_px = 216.0 - y2_px
        self.assertAlmostEqual(margin_px, 3.2, places=4, msg="HUD safety margin must be exactly 3.2 px")

        # Bottom clear height reserved for HUD
        hud_height_px = 266.0 - y2_px
        self.assertAlmostEqual(hud_height_px, 53.2, places=4, msg="Bottom HUD space must be exactly 53.2 px")

        # Check all other foreground buttons
        for btn in self.buttons:
            if btn['command'] != '_look':
                btn_y2_px = btn['y2'] * 266.0
                self.assertLessEqual(btn_y2_px, 216.0, f"Button {btn['name']} exceeds HUD threshold: {btn_y2_px} > 216")

    def test_partition_boundary_and_deadband(self):
        """Verify strict isolation and physical deadband gap between left movement and look zone."""
        joy = self.btn_map['joy']
        look = self.btn_map['look']

        # Joy boundary: large proportional stick within left 0.26 boundary
        self.assertLessEqual(joy['x2'], 0.260000)
        self.assertAlmostEqual(joy['x2'], 0.248750, places=4)

        # Left controls max x2
        left_controls = [b for b in self.buttons if b['name'] in ('joy', 'crouch', 'cjump')]
        max_left_x2 = max(b['x2'] for b in left_controls)
        self.assertLessEqual(max_left_x2, 0.420000)

        # Look boundary: shifted right to protect left hand controls
        self.assertGreaterEqual(look['x1'], 0.460000)

        # Deadband buffer gap
        deadband_norm = look['x1'] - max_left_x2
        deadband_px = deadband_norm * 960.0
        self.assertGreater(deadband_norm, 0.059, "Deadband buffer must be >= 0.059 normalized units")
        self.assertGreater(deadband_px, 56.0, "Deadband buffer must be >= 56 pixels wide")

    def test_square_aspect_ratio_and_floating_point_perturbations(self):
        """Stress-test square pixel aspect ratio against floating point epsilon perturbations."""
        for btn in self.buttons:
            if not btn['texture'] or btn['command'] == '_look':
                continue
            name = btn['name']
            w_px = (btn['x2'] - btn['x1']) * 960.0
            h_px = (btn['y2'] - btn['y1']) * 266.0
            diff = abs(w_px - h_px)
            self.assertLessEqual(diff, 0.02, f"Button {name} non-square: w={w_px}, h={h_px}, diff={diff}")

            # Perturb coordinates with IEEE 754 float epsilon (1e-6 to 1e-4)
            for eps in (-1e-5, -1e-6, 1e-6, 1e-5):
                perturbed_w_px = ((btn['x2'] + eps) - btn['x1']) * 960.0
                distort = abs(perturbed_w_px - w_px)
                self.assertLess(distort, 0.01, f"Perturbation epsilon {eps} caused excessive distortion {distort} px")

    def test_configs_are_in_sync(self):
        """Ensure assets/valve/touch.cfg and dist_assets/valve/touch.cfg are identical."""
        self.assertEqual(CFG_PATHS[0].read_bytes(), CFG_PATHS[1].read_bytes(),
                         "touch.cfg in assets and dist_assets must be byte-for-byte identical")


class AdversarialNativeHarnessExecution(unittest.TestCase):
    """Executes the native compiled C stress harness."""

    @classmethod
    def setUpClass(cls):
        # Compile harness with clang
        cmd = ['clang', '-O3', '-Wall', '-Wextra', str(HARNESS_SRC), '-o', str(HARNESS_BIN)]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(f"Failed to compile harness: {proc.stderr}")

    def test_native_adversarial_harness_full_pass(self):
        """Run native adversarial harness and assert exit code 0."""
        proc = subprocess.run([str(HARNESS_BIN)], capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, f"Harness crashed or assertion failed:\n{proc.stdout}\n{proc.stderr}")
        self.assertIn("[PASS] Test_Boundary_HUD_Clearance", proc.stdout)
        self.assertIn("[PASS] Test_Partition_At_026_Deadband", proc.stdout)
        self.assertIn("[PASS] Test_HighFreq_Alternating_Buttons", proc.stdout)
        self.assertIn("[PASS] Test_CJump_Spam_While_Holding_Joy", proc.stdout)
        self.assertIn("[PASS] Test_Precision_Flag_With_Break", proc.stdout)
        self.assertIn("[PASS] Test_Full_Touch_Cfg_Layout_Adversarial", proc.stdout)
        self.assertIn("=== All 6 Adversarial Harness Suites Passed Successfully ===", proc.stdout)


if __name__ == '__main__':
    unittest.main()
