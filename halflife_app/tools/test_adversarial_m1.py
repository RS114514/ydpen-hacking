#!/usr/bin/env python3
"""
Empirical Adversarial Test Suite for M1: Touch Controls & Look Preemption
Author: teamwork_challenger (Critic & Specialist)
Target: halflife_app touch subsystem (Virtual Joystick & Button Break Isolation)
"""

import math
import shlex
import sys
import unittest
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
CFG_PATH = BASE_DIR / "assets" / "valve" / "touch.cfg"
DIST_CFG_PATH = BASE_DIR / "dist_assets" / "valve" / "touch.cfg"


# ==============================================================================
# 1. Mathematical Simulation of StickVector vs DPAD
# ==============================================================================

class VirtualStickModel:
    """
    Direct Python equivalent of Touch_StickVector in upstream/engine/client/input/in_touch.c:
    lines 1474-1496.
    """
    def __init__(self, x1, y1, x2, y2):
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.stick_x = 0.0
        self.stick_y = 0.0

    def stick_vector(self, x, y):
        half_width = max((self.x2 - self.x1) * 0.5, 0.0001)
        half_height = max((self.y2 - self.y1) * 0.5, 0.0001)
        center_x = (self.x1 + self.x2) * 0.5
        center_y = (self.y1 + self.y2) * 0.5
        sx = (x - center_x) / half_width
        sy = (y - center_y) / half_height
        length = math.sqrt(sx * sx + sy * sy)

        self.stick_x = sx / length if length > 1.0 else sx
        self.stick_y = sy / length if length > 1.0 else sy

        if length == 0.0:
            return 0.0, 0.0

        amount = min(length, 1.0)
        side = sx / length * amount
        forward = -sy / length * amount
        return side, forward


class LegacyDpadModel:
    """
    Direct Python equivalent of legacy touch_dpad in in_touch.c:
    lines 2043-2055.
    """
    def __init__(self, x1, y1, x2, y2):
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2

    def dpad_vector(self, x, y):
        forward = ((self.y2 + self.y1) - y * 2.0) / (self.y2 - self.y1)
        side = (x * 2.0 - (self.x2 + self.x1)) / (self.x2 - self.x1)
        # legacy dpad applies round()
        forward = float(round(forward))
        side = float(round(side))
        return side, forward


# ==============================================================================
# 2. Touch Event Dispatcher Simulation (Reproducing Break vs Non-Break)
# ==============================================================================

TOUCH_COMMAND = 1
TOUCH_JOY = 2
TOUCH_LOOK = 3
TOUCH_DPAD = 4

EVENT_DOWN = 0
EVENT_UP = 1
EVENT_MOTION = 2

class MockTouchButton:
    def __init__(self, name, btype, x1, y1, x2, y2, command="", flags=0):
        self.name = name
        self.type = btype
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.command = command
        self.flags = flags
        self.finger = -1
        self.stick_x = 0.0
        self.stick_y = 0.0

class TouchEngineState:
    def __init__(self, buttons, with_break=True):
        self.buttons = buttons  # ordered as registered (first to last)
        self.with_break = with_break
        self.move_finger = -1
        self.look_finger = -1
        self.move_stick = False
        self.move_button = None
        self.forward = 0.0
        self.side = 0.0
        self.yaw = 0.0
        self.pitch = 0.0
        self.yaw_rate = 120.0
        self.pitch_rate = 90.0
        self.executed_commands = []

    def dispatch_press(self, event_type, finger_id, x, y):
        # Reverse order scan: list->last to list->first
        for button in reversed(self.buttons):
            if event_type == EVENT_DOWN:
                if not (button.x1 <= x <= button.x2 and button.y1 <= y <= button.y2):
                    continue

                if button.type == TOUCH_JOY:
                    rx = (x - (button.x1 + button.x2) * 0.5) / max((button.x2 - button.x1) * 0.5, 0.0001)
                    ry = (y - (button.y1 + button.y2) * 0.5) / max((button.y2 - button.y1) * 0.5, 0.0001)
                    if rx * rx + ry * ry > 1.0:
                        continue
                    if button.finger != -1:
                        continue

                button.finger = finger_id

                if button.type == TOUCH_COMMAND:
                    self.executed_commands.append(button.command)
                    if self.with_break:
                        break
                    else:
                        continue  # Bug: falls through to underlying look!

                elif button.type == TOUCH_JOY or button.type == TOUCH_DPAD:
                    if self.move_finger != -1:
                        button.finger = self.move_finger
                        continue
                    if self.look_finger == finger_id:
                        # Conflict recovery
                        self.move_finger = self.look_finger = -1
                        continue

                    self.move_finger = finger_id
                    self.move_stick = (button.type == TOUCH_JOY)
                    self.move_button = button
                    if self.move_stick:
                        stick = VirtualStickModel(button.x1, button.y1, button.x2, button.y2)
                        self.side, self.forward = stick.stick_vector(x, y)
                    else:
                        dpad = LegacyDpadModel(button.x1, button.y1, button.x2, button.y2)
                        self.side, self.forward = dpad.dpad_vector(x, y)

                elif button.type == TOUCH_LOOK:
                    if self.look_finger != -1:
                        button.finger = self.look_finger
                        continue
                    if self.move_finger == finger_id:
                        self.move_finger = self.look_finger = -1
                        continue
                    self.look_finger = finger_id

            elif event_type == EVENT_UP:
                if finger_id != button.finger:
                    continue
                button.finger = -1
                if button.type == TOUCH_COMMAND:
                    if self.with_break:
                        break
                    else:
                        continue
                elif button.type in (TOUCH_JOY, TOUCH_DPAD):
                    self.move_finger = -1
                    self.move_stick = False
                    self.move_button = None
                    self.forward = 0.0
                    self.side = 0.0
                    if self.with_break:
                        break
                elif button.type == TOUCH_LOOK:
                    self.look_finger = -1
                    if self.with_break:
                        break

    def dispatch_motion(self, finger_id, x, y, dx, dy):
        if self.move_stick and finger_id == self.move_finger:
            stick = VirtualStickModel(self.move_button.x1, self.move_button.y1,
                                      self.move_button.x2, self.move_button.y2)
            self.side, self.forward = stick.stick_vector(x, y)

        if finger_id == self.look_finger:
            self.yaw -= dx * self.yaw_rate
            self.pitch += dy * self.pitch_rate


# ==============================================================================
# 3. Test Cases
# ==============================================================================

class TestVirtualStickDeadzoneAndContinuity(unittest.TestCase):
    """
    Stress-tests the claim: Virtual Joystick eliminates 50% dead zone and provides
    continuous proportional linear output, whereas legacy dpad suffered from round() truncation.
    """
    def setUp(self):
        # 154x154 pixel joystick bounds on 960x266 screen
        self.x1 = 0.040000
        self.y1 = 0.220000
        self.x2 = 0.200708
        self.y2 = 0.800000
        self.stick = VirtualStickModel(self.x1, self.y1, self.x2, self.y2)
        self.dpad = LegacyDpadModel(self.x1, self.y1, self.x2, self.y2)
        self.cx = (self.x1 + self.x2) * 0.5
        self.cy = (self.y1 + self.y2) * 0.5
        self.rx = (self.x2 - self.x1) * 0.5
        self.ry = (self.y2 - self.y1) * 0.5

    def test_deadzone_elimination_at_small_displacements(self):
        """
        Adversarial test: Test delta in (0.01 .. 0.49).
        Legacy dpad MUST fail (round to 0).
        Virtual stick MUST pass (produce non-zero smooth proportional vector).
        """
        small_deltas = [0.01, 0.05, 0.10, 0.20, 0.30, 0.40, 0.48, 0.499]
        for delta in small_deltas:
            test_x = self.cx + delta * self.rx
            test_y = self.cy

            # Legacy DPAD
            dpad_side, dpad_fwd = self.dpad.dpad_vector(test_x, test_y)
            self.assertEqual(dpad_side, 0.0, f"Legacy dpad failed to demonstrate dead zone at delta={delta}")
            self.assertEqual(dpad_fwd, 0.0)

            # Modern Virtual Stick
            joy_side, joy_fwd = self.stick.stick_vector(test_x, test_y)
            self.assertGreater(joy_side, 0.0, f"Stick has unexpected dead zone at delta={delta}")
            self.assertAlmostEqual(joy_side, delta, places=4,
                                   msg=f"Stick output {joy_side} does not match proportional displacement {delta}")
            self.assertAlmostEqual(joy_fwd, 0.0, places=4)

    def test_high_density_continuity_sweep(self):
        """
        Sweep 1000 steps from center to full deflection.
        Verify:
        - Output is strictly monotonic.
        - First derivative is constant (1.0).
        - No discontinuous step jumps (unlike round() jump at 0.5).
        """
        steps = 1000
        prev_side = -1e-6
        for i in range(1, steps + 1):
            ratio = i / float(steps)
            x = self.cx + ratio * self.rx
            y = self.cy
            side, fwd = self.stick.stick_vector(x, y)

            self.assertGreater(side, prev_side, f"Displacement not strictly monotonic at ratio={ratio}")
            self.assertAlmostEqual(side, ratio, places=4, msg="Nonlinear distortion detected")
            prev_side = side

    def test_isotropic_angular_fidelity(self):
        """
        Test 360-degree radial fidelity at various radii (r = 0.25, 0.5, 0.75, 1.0).
        Angle of output vector must strictly equal input angle within 1e-4 radians.
        """
        for r in (0.1, 0.25, 0.5, 0.75, 1.0):
            for deg in range(0, 360, 15):
                rad = math.radians(deg)
                x = self.cx + r * math.cos(rad) * self.rx
                y = self.cy - r * math.sin(rad) * self.ry  # Screen y is inverted

                side, forward = self.stick.stick_vector(x, y)
                magnitude = math.sqrt(side * side + forward * forward)
                self.assertAlmostEqual(magnitude, r, places=4,
                                       msg=f"Radial magnitude error at r={r}, deg={deg}")

                calc_rad = math.atan2(forward, side)
                if calc_rad < 0:
                    calc_rad += 2 * math.pi
                diff = abs(calc_rad - rad)
                if diff > math.pi:
                    diff = abs(diff - 2 * math.pi)
                self.assertLess(diff, 1e-4, f"Angular distortion at r={r}, deg={deg}")

    def test_overdeflection_clamping(self):
        """
        When thumb moves beyond joystick bounds (e.g., r = 1.5, 2.0, 5.0),
        vector magnitude MUST be clamped to 1.0 without inversion or NaN.
        """
        for factor in (1.1, 1.5, 2.0, 5.0):
            x = self.cx + factor * self.rx
            y = self.cy
            side, forward = self.stick.stick_vector(x, y)
            self.assertAlmostEqual(side, 1.0, places=4)
            self.assertAlmostEqual(forward, 0.0, places=4)


class TestLookPreemptionAndMultiTouchConcurrency(unittest.TestCase):
    """
    Stress-tests the claim: Adding 'break;' in Touch_ButtonPress prevents
    foreground button presses from falling through into background touch_look,
    eliminating view jumping and look lockouts during rapid fire or multi-touch.
    """
    def _create_layout(self):
        # Matches touch.cfg structure
        return [
            # 1. Background look registered FIRST (in front of list head, behind actions in reverse scan)
            MockTouchButton("look", TOUCH_LOOK, 0.26, 0.0, 1.0, 1.0),
            # 2. Joystick on left
            MockTouchButton("joy", TOUCH_JOY, 0.04, 0.22, 0.200708, 0.80),
            # 3. Actions on right
            MockTouchButton("reload", TOUCH_COMMAND, 0.65, 0.23, 0.7125, 0.455564, "+reload"),
            MockTouchButton("fire", TOUCH_COMMAND, 0.74, 0.38, 0.823333, 0.680752, "+attack"),
            MockTouchButton("jump", TOUCH_COMMAND, 0.86, 0.12, 0.930833, 0.375639, "+jump 73"),
            MockTouchButton("use", TOUCH_COMMAND, 0.86, 0.50, 0.930833, 0.755639, "+use"),
        ]

    def test_vulnerability_reproduction_without_break(self):
        """
        Adversarial demonstration of the bug:
        When with_break=False, tapping 'fire' MUST leak to 'look', stealing look_finger.
        Subsequent micro-motions of the firing finger MUST corrupt yaw/pitch.
        """
        buttons = self._create_layout()
        engine = TouchEngineState(buttons, with_break=False)

        # Slot 1 presses 'fire' at (0.78, 0.50)
        engine.dispatch_press(EVENT_DOWN, finger_id=1, x=0.78, y=0.50)

        # Command is issued
        self.assertIn("+attack", engine.executed_commands)

        # BUG CONFIRMATION: look_finger was hijacked by finger 1!
        self.assertEqual(engine.look_finger, 1,
                         "Vulnerability assertion: without break, look_finger must be hijacked by button press")

        # Now finger 1 micro-tremors (dx=0.005, dy=0.003)
        engine.dispatch_motion(finger_id=1, x=0.785, y=0.503, dx=0.005, dy=0.003)
        self.assertNotEqual(engine.yaw, 0.0, "Without break, view yaw was corrupted by button press jitter")
        self.assertNotEqual(engine.pitch, 0.0, "Without break, view pitch was corrupted by button press jitter")

    def test_fix_validation_with_break(self):
        """
        Validation of the fix:
        When with_break=True, tapping 'fire' MUST execute command and break immediately.
        look_finger MUST remain -1. Micro-motions on button MUST NOT affect yaw/pitch.
        """
        buttons = self._create_layout()
        engine = TouchEngineState(buttons, with_break=True)

        # Slot 1 presses 'fire' at (0.78, 0.50)
        engine.dispatch_press(EVENT_DOWN, finger_id=1, x=0.78, y=0.50)

        self.assertIn("+attack", engine.executed_commands)
        self.assertEqual(engine.look_finger, -1,
                         "Fix assertion: with break, look_finger must remain -1 when pressing buttons")

        # Finger 1 micro-tremors
        engine.dispatch_motion(finger_id=1, x=0.785, y=0.503, dx=0.005, dy=0.003)
        self.assertEqual(engine.yaw, 0.0, "View yaw must be perfectly stable during button press")
        self.assertEqual(engine.pitch, 0.0, "View pitch must be perfectly stable during button press")

    def test_concurrent_move_and_rapid_fire(self):
        """
        Stress test:
        - Slot 0 holds Joystick on left, moving continuously.
        - Slot 1 rapidly fires 100 rounds on right (+attack).
        Assert:
        - Slot 0 move vector is never interrupted or zeroed.
        - look_finger is never hijacked.
        - View remains steady.
        """
        buttons = self._create_layout()
        engine = TouchEngineState(buttons, with_break=True)

        # 1. Slot 0 touches joystick and pushes forward-right
        engine.dispatch_press(EVENT_DOWN, finger_id=0, x=0.15, y=0.35)
        self.assertEqual(engine.move_finger, 0)
        initial_side = engine.side
        initial_forward = engine.forward
        self.assertGreater(initial_forward, 0.0)

        # 2. Slot 1 rapidly clicks fire 100 times
        for click in range(100):
            engine.dispatch_press(EVENT_DOWN, finger_id=1, x=0.78, y=0.50)
            engine.dispatch_motion(finger_id=1, x=0.781, y=0.501, dx=0.001, dy=0.001)
            engine.dispatch_press(EVENT_UP, finger_id=1, x=0.781, y=0.501)

            # Assert move state intact
            self.assertEqual(engine.move_finger, 0, f"Move interrupted at click {click}")
            self.assertEqual(engine.side, initial_side)
            self.assertEqual(engine.forward, initial_forward)
            self.assertEqual(engine.look_finger, -1)
            self.assertEqual(engine.yaw, 0.0)

    def test_held_fire_with_concurrent_look_pan(self):
        """
        Core FPS interaction:
        - Slot 0 holds 'fire' (+attack) continuously (automatic weapon fire).
        - Slot 1 pans view on right touch_look area.
        Without break: Slot 0 hijacked look_finger, Slot 1 fails to look.
        With break: Slot 0 ONLY holds fire, Slot 1 gets look_finger and smoothly pans view.
        """
        # Test buggy engine
        buggy_buttons = self._create_layout()
        buggy = TouchEngineState(buggy_buttons, with_break=False)
        buggy.dispatch_press(EVENT_DOWN, finger_id=0, x=0.78, y=0.50)  # Slot 0 holds fire
        self.assertEqual(buggy.look_finger, 0)  # Hijacked!
        buggy.dispatch_press(EVENT_DOWN, finger_id=1, x=0.50, y=0.50)  # Slot 1 tries to look
        self.assertEqual(buggy.look_finger, 0)  # Still 0, Slot 1 blocked!
        buggy.dispatch_motion(finger_id=1, x=0.52, y=0.50, dx=0.02, dy=0.0)
        self.assertEqual(buggy.yaw, 0.0, "Buggy engine failed to pan view with finger 1 while holding fire")

        # Test fixed engine
        fixed_buttons = self._create_layout()
        fixed = TouchEngineState(fixed_buttons, with_break=True)
        fixed.dispatch_press(EVENT_DOWN, finger_id=0, x=0.78, y=0.50)  # Slot 0 holds fire
        self.assertEqual(fixed.look_finger, -1)  # Free!
        fixed.dispatch_press(EVENT_DOWN, finger_id=1, x=0.50, y=0.50)  # Slot 1 touches look area
        self.assertEqual(fixed.look_finger, 1)  # Acquired!
        fixed.dispatch_motion(finger_id=1, x=0.52, y=0.50, dx=0.02, dy=0.0)
        self.assertNotEqual(fixed.yaw, 0.0, "Fixed engine pans view smoothly while holding fire")

    def test_wheel_weapon_switch_does_not_hijack_look(self):
        """
        Adversarial test: wheel widgets (_hwheel / _vwheel) with break.
        Tapping or dragging wheel MUST NOT hijack look_finger.
        """
        buttons = self._create_layout()
        # Add wheel on top right
        wheel = MockTouchButton("wheel", TOUCH_COMMAND, 0.73, 0.02, 0.835, 0.185, "invnext")
        buttons.append(wheel)

        engine = TouchEngineState(buttons, with_break=True)
        engine.dispatch_press(EVENT_DOWN, finger_id=1, x=0.75, y=0.10)
        self.assertEqual(engine.look_finger, -1, "Wheel press must not hijack look_finger")

    def test_fuzzing_random_multitouch_stress(self):
        """
        Adversarial Fuzzing:
        Inject 1000 randomized dual-slot operations (random down, motion, up).
        Invariants checked after every single step:
        1. move_finger and look_finger are never the same finger unless both -1.
        2. yaw and pitch are never NaN or Inf.
        3. Virtual joystick side/forward never exceed [-1.0, 1.0].
        """
        import random
        random.seed(42)

        buttons = self._create_layout()
        engine = TouchEngineState(buttons, with_break=True)
        active_fingers = {0: False, 1: False}

        for step in range(1000):
            fid = random.choice([0, 1])
            action = random.choice(["press", "motion", "release"])
            rx = random.uniform(0.0, 1.0)
            ry = random.uniform(0.0, 1.0)

            if action == "press" and not active_fingers[fid]:
                engine.dispatch_press(EVENT_DOWN, finger_id=fid, x=rx, y=ry)
                active_fingers[fid] = True
            elif action == "motion" and active_fingers[fid]:
                dx = random.uniform(-0.05, 0.05)
                dy = random.uniform(-0.05, 0.05)
                engine.dispatch_motion(finger_id=fid, x=rx, y=ry, dx=dx, dy=dy)
            elif action == "release" and active_fingers[fid]:
                engine.dispatch_press(EVENT_UP, finger_id=fid, x=rx, y=ry)
                active_fingers[fid] = False

            # Invariant 1: No finger collision between look and move
            if engine.move_finger != -1 and engine.look_finger != -1:
                self.assertNotEqual(engine.move_finger, engine.look_finger,
                                    f"Invariant failure at step {step}: finger collision!")

            # Invariant 2: Mathematical validity
            self.assertFalse(math.isnan(engine.yaw) or math.isinf(engine.yaw))
            self.assertFalse(math.isnan(engine.pitch) or math.isinf(engine.pitch))

            # Invariant 3: Stick magnitude bounds
            self.assertGreaterEqual(engine.side, -1.0)
            self.assertLessEqual(engine.side, 1.0)
            self.assertGreaterEqual(engine.forward, -1.0)
            self.assertLessEqual(engine.forward, 1.0)



class TestLayoutGeometricConsistency(unittest.TestCase):
    """
    Stress-tests the deployed configuration files against physical device constraints.
    """
    def _parse_cfg(self, path):
        lines = path.read_text().splitlines()
        buttons = []
        for line in lines:
            parts = shlex.split(line, comments=True)
            if parts and parts[0] == "touch_addbutton":
                buttons.append(parts)
        return buttons

    def test_both_configs_identical_and_valid(self):
        self.assertTrue(CFG_PATH.is_file(), f"Missing {CFG_PATH}")
        self.assertTrue(DIST_CFG_PATH.is_file(), f"Missing {DIST_CFG_PATH}")

        src_btns = self._parse_cfg(CFG_PATH)
        dist_btns = self._parse_cfg(DIST_CFG_PATH)

        self.assertEqual(len(src_btns), len(dist_btns), "Mismatch in button count between source and dist config")
        for b1, b2 in zip(src_btns, dist_btns):
            self.assertEqual(b1, b2, f"Config divergence detected: {b1[1]}")

    def test_joystick_geometry_and_hud_clearance(self):
        btns = {b[1]: b for b in self._parse_cfg(CFG_PATH)}
        self.assertIn("joy", btns)
        joy = btns["joy"]

        self.assertEqual(joy[3], "_joy", "Joystick action must be native '_joy'")
        self.assertEqual(joy[12], "2048", "Joystick flags must include TOUCH_FL_STICK (2048)")

        x1, y1, x2, y2 = map(float, joy[4:8])
        w_px = (x2 - x1) * 960.0
        h_px = (y2 - y1) * 266.0

        # Exact square aspect ratio
        self.assertAlmostEqual(w_px, h_px, delta=0.01,
                               msg=f"Joystick is not square in pixels: {w_px}x{h_px}")

        # Partition constraint: strictly on left
        self.assertLessEqual(x2, 0.26, f"Joystick exceeds left partition: x2={x2} > 0.26")

        # HUD clearance: y2 * 266 <= 216
        bottom_px = y2 * 266.0
        self.assertLessEqual(bottom_px, 216.0, f"Joystick intrudes into HUD area: {bottom_px}px > 216px")

    def test_button_order_priority(self):
        btns = self._parse_cfg(CFG_PATH)
        names = [b[1] for b in btns]
        look_idx = names.index("look")

        # All right-side action buttons must appear AFTER 'look' in touch.cfg
        # so that reverse-order scan encounters them BEFORE 'look'
        action_names = ["reload", "alt_fire", "fire", "jump", "use"]
        for action in action_names:
            act_idx = names.index(action)
            self.assertGreater(act_idx, look_idx,
                               f"Action '{action}' (index {act_idx}) must be registered after 'look' (index {look_idx})")


if __name__ == "__main__":
    unittest.main()
