/*
 * adversarial_touch_harness.c
 * Standalone adversarial stress test for Xash3D touch engine logic.
 * Models Touch_ButtonPress, Touch_StickVector, Touch_Motion, and state machines
 * exactly matching upstream/engine/client/input/in_touch.c.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <math.h>
#include <assert.h>
#include <float.h>

#define Q_max(a, b) (((a) > (b)) ? (a) : (b))
#define Q_min(a, b) (((a) < (b)) ? (a) : (b))
#define FBitSet(val, bit) ((val) & (bit))
#define bound(min, val, max) (((val) < (min)) ? (min) : (((val) > (max)) ? (max) : (val)))

#define TOUCH_FL_STICK         (1U << 11) // 2048
#define TOUCH_FL_COMMAND_LATCH (1U << 12) // 4096
#define TOUCH_FL_PRECISION     (1U << 9)  // 512

typedef enum {
    touch_command,
    touch_move,
    touch_joy,
    touch_dpad,
    touch_look,
    touch_wheel
} touchButtonType;

typedef enum {
    event_down,
    event_up,
    event_motion
} touchEventType;

typedef struct touch_button_s {
    touchButtonType type;
    float x1, y1, x2, y2;
    char name[32];
    char command[256];
    int finger;
    int flags;
    float stick_x, stick_y;
    bool latched;
    struct touch_button_s *next;
    struct touch_button_s *prev;
} touch_button_t;

typedef struct touchbuttonlist_s {
    touch_button_t *first;
    touch_button_t *last;
} touchbuttonlist_t;

typedef struct touch_s {
    touchbuttonlist_t list_user;
    int look_finger;
    int move_finger;
    bool move_stick;
    touch_button_t *move_button;
    float forward;
    float side;
    float yaw;
    float pitch;
    bool precision;
} touch_t;

static touch_t g_touch;
static char g_last_command[256];
static int g_cmd_count = 0;

static void Touch_Reset(void) {
    memset(&g_touch, 0, sizeof(g_touch));
    g_touch.look_finger = -1;
    g_touch.move_finger = -1;
    g_touch.move_button = NULL;
    g_last_command[0] = '\0';
    g_cmd_count = 0;
}

static void Touch_AddButton(touchbuttonlist_t *list, const char *name, const char *cmd, float x1, float y1, float x2, float y2, int flags) {
    touch_button_t *btn = (touch_button_t *)calloc(1, sizeof(touch_button_t));
    assert(btn != NULL);
    snprintf(btn->name, sizeof(btn->name), "%s", name);
    snprintf(btn->command, sizeof(btn->command), "%s", cmd);
    btn->x1 = x1; btn->y1 = y1; btn->x2 = x2; btn->y2 = y2;
    btn->flags = flags;
    btn->finger = -1;

    if (!strcmp(cmd, "_look")) btn->type = touch_look;
    else if (!strcmp(cmd, "_move")) btn->type = touch_move;
    else if (!strcmp(cmd, "_joy")) btn->type = touch_joy;
    else if (!strcmp(cmd, "_dpad")) btn->type = touch_dpad;
    else btn->type = touch_command;

    if (!list->first) {
        list->first = list->last = btn;
    } else {
        list->last->next = btn;
        btn->prev = list->last;
        list->last = btn;
    }
}

static void Touch_FreeList(touchbuttonlist_t *list) {
    touch_button_t *curr = list->first;
    while (curr) {
        touch_button_t *next = curr->next;
        free(curr);
        curr = next;
    }
    list->first = list->last = NULL;
}

static void Touch_AddButtonCommand(touch_button_t *btn, const char *cmd) {
    (void)btn;
    snprintf(g_last_command, sizeof(g_last_command), "%s", cmd);
    g_cmd_count++;
}

static void Touch_StickVector(touch_button_t *button, float x, float y, float *side, float *forward) {
    float half_width = Q_max((button->x2 - button->x1) * 0.5f, 0.0001f);
    float half_height = Q_max((button->y2 - button->y1) * 0.5f, 0.0001f);
    float center_x = (button->x1 + button->x2) * 0.5f;
    float center_y = (button->y1 + button->y2) * 0.5f;
    float sx = (x - center_x) / half_width;
    float sy = (y - center_y) / half_height;
    float length = sqrtf(sx * sx + sy * sy);

    button->stick_x = length > 1 ? sx / length : sx;
    button->stick_y = length > 1 ? sy / length : sy;
    if (length == 0) {
        *side = *forward = 0;
        return;
    }

    float amount = Q_min(length, 1);
    *side = sx / length * amount;
    *forward = -sy / length * amount;
}

static bool Touch_ButtonPress(touchbuttonlist_t *list, touchEventType type, int fingerID, float x, float y) {
    bool result = false;
    if (type != event_down && type != event_up)
        return false;

    // run from end (front) to start (back)
    for (touch_button_t *button = list->last; button; button = button->prev) {
        if (type == event_down) {
            // button bounds check
            if (x < button->x1 || x > button->x2 || y < button->y1 || y > button->y2)
                continue;

            if (FBitSet(button->flags, TOUCH_FL_STICK) && button->type == touch_joy) {
                float rx = (x - (button->x1 + button->x2) * 0.5f) / Q_max((button->x2 - button->x1) * 0.5f, 0.0001f);
                float ry = (y - (button->y1 + button->y2) * 0.5f) / Q_max((button->y2 - button->y1) * 0.5f, 0.0001f);
                if (rx * rx + ry * ry > 1)
                    continue;
            }
            if (FBitSet(button->flags, TOUCH_FL_STICK) && button->type == touch_joy && button->finger != -1)
                continue;

            button->finger = fingerID;

            if (button->type == touch_command) {
                char command[256];
                if (button->command[0] == '+' && FBitSet(button->flags, TOUCH_FL_COMMAND_LATCH)) {
                    button->latched = !button->latched;
                    snprintf(command, sizeof(command), "%c%s\n", button->latched ? '+' : '-', &button->command[1]);
                } else {
                    snprintf(command, sizeof(command), "%s\n", button->command);
                }
                Touch_AddButtonCommand(button, command);

                if (FBitSet(button->flags, TOUCH_FL_PRECISION))
                    g_touch.precision = true;

                result = true;
                break; // BREAK TO PREVENT PASS-THROUGH
            } else if (button->type == touch_wheel) {
                if (FBitSet(button->flags, TOUCH_FL_PRECISION))
                    g_touch.precision = true;
                result = true;
                break;
            } else if (button->type == touch_move || button->type == touch_joy || button->type == touch_dpad) {
                if (g_touch.move_finger != -1) {
                    button->finger = g_touch.move_finger;
                    continue;
                }
                result = true;
                if (g_touch.look_finger == fingerID) {
                    g_touch.move_finger = g_touch.look_finger = -1;
                    continue;
                }
                g_touch.move_finger = fingerID;
                g_touch.move_stick = FBitSet(button->flags, TOUCH_FL_STICK) && button->type == touch_joy;
                g_touch.move_button = button;

                if (g_touch.move_stick)
                    Touch_StickVector(button, x, y, &g_touch.side, &g_touch.forward);
                else {
                    g_touch.forward = ((button->y2 + button->y1) - y * 2) / (button->y2 - button->y1);
                    g_touch.side = (x * 2 - (button->x2 + button->x1)) / (button->x2 - button->x1);
                }
            } else if (button->type == touch_look) {
                if (g_touch.look_finger != -1) {
                    button->finger = g_touch.look_finger;
                    continue;
                }
                result = true;
                if (g_touch.move_finger == fingerID) {
                    g_touch.move_finger = g_touch.look_finger = -1;
                    continue;
                }
                g_touch.look_finger = fingerID;
            }
        } else if (type == event_up) {
            if (fingerID != button->finger)
                continue;

            button->finger = -1;

            if (button->type == touch_command) {
                if (button->command[0] == '+' && !FBitSet(button->flags, TOUCH_FL_COMMAND_LATCH)) {
                    char command[256];
                    snprintf(command, sizeof(command), "-%s\n", &button->command[1]);
                    Touch_AddButtonCommand(button, command);
                }
                if (FBitSet(button->flags, TOUCH_FL_PRECISION))
                    g_touch.precision = false;

                result = true;
                break; // BREAK ON UP
            } else if (button->type == touch_wheel) {
                if (FBitSet(button->flags, TOUCH_FL_PRECISION))
                    g_touch.precision = false;
                result = true;
                break;
            } else if (button->type == touch_move || button->type == touch_joy || button->type == touch_dpad) {
                g_touch.move_finger = -1;
                g_touch.forward = g_touch.side = 0;
                g_touch.move_button = NULL;
            } else if (button->type == touch_look) {
                g_touch.look_finger = -1;
            }
        }
    }
    return result;
}

static void Touch_Motion(int fingerID, float x, float y, float dx, float dy) {
    if (fingerID == g_touch.move_finger) {
        if (g_touch.move_stick && g_touch.move_button) {
            Touch_StickVector(g_touch.move_button, x, y, &g_touch.side, &g_touch.forward);
            return;
        }
    }
    if (fingerID == g_touch.look_finger) {
        if (g_touch.precision) {
            dx *= 0.5f;
            dy *= 0.5f;
        }
        g_touch.yaw -= dx * 120.0f;
        g_touch.pitch += dy * 90.0f;
    }
}

// ----------------------------------------------------------------------------
// Test 1: Boundary & HUD clearance
// ----------------------------------------------------------------------------
static void Test_Boundary_HUD_Clearance(void) {
    Touch_Reset();
    Touch_FreeList(&g_touch.list_user);

    // Register look first (bottom of stack)
    Touch_AddButton(&g_touch.list_user, "look", "_look", 0.26f, 0.0f, 1.0f, 1.0f, 0);
    // Register joy (x: 0.04..0.200708, y: 0.22..0.80)
    Touch_AddButton(&g_touch.list_user, "joy", "_joy", 0.040000f, 0.220000f, 0.200708f, 0.800000f, TOUCH_FL_STICK);

    // 1.1 Touch exactly at y = 0.800000 (center-x of joy = 0.120354)
    bool hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.120354f, 0.800000f);
    assert(hit && "Touch at y=0.800000 should hit joy bottom edge");
    assert(g_touch.move_finger == 0);
    Touch_ButtonPress(&g_touch.list_user, event_up, 0, 0.120354f, 0.800000f);
    assert(g_touch.move_finger == -1);

    // 1.2 Touch at y = 0.800005 (beyond joy, before HUD boundary 216/266 = 0.81203)
    hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.120354f, 0.800005f);
    assert(!hit && "Touch beyond y=0.800000 must NOT hit joy");
    assert(g_touch.move_finger == -1);

    // 1.3 Touch at y = 0.812030 (HUD boundary) and y = 0.95 (inside HUD)
    hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.120354f, 0.812030f);
    assert(!hit && "Touch in HUD zone must not trigger joy");
    hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.120354f, 0.950000f);
    assert(!hit && "Touch in HUD zone must not trigger joy");

    // 1.4 Dynamic motion: Finger down inside joy, drag all the way down into HUD (y = 0.98)
    hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.120354f, 0.510000f); // center
    assert(hit && g_touch.move_finger == 0);
    Touch_Motion(0, 0.120354f, 0.980000f, 0.0f, 0.470000f);
    // Forward should be clamped to -1.0, side should be 0.0
    assert(fabsf(g_touch.forward - (-1.0f)) < 0.0001f);
    assert(fabsf(g_touch.side - 0.0f) < 0.0001f);
    float length = sqrtf(g_touch.side * g_touch.side + g_touch.forward * g_touch.forward);
    assert(fabsf(length - 1.0f) < 0.0001f && "Joy vector must be clamped to 1.0");

    Touch_ButtonPress(&g_touch.list_user, event_up, 0, 0.120354f, 0.980000f);
    assert(g_touch.move_finger == -1);
    assert(g_touch.forward == 0.0f && g_touch.side == 0.0f);
    printf("[PASS] Test_Boundary_HUD_Clearance\n");
}

// ----------------------------------------------------------------------------
// Test 2: Screen partition at x = 0.26 and deadband isolation
// ----------------------------------------------------------------------------
static void Test_Partition_At_026_Deadband(void) {
    Touch_Reset();
    Touch_FreeList(&g_touch.list_user);

    Touch_AddButton(&g_touch.list_user, "look", "_look", 0.260000f, 0.0f, 1.0f, 1.0f, 0);
    Touch_AddButton(&g_touch.list_user, "joy", "_joy", 0.040000f, 0.220000f, 0.200708f, 0.800000f, TOUCH_FL_STICK);

    // 2.1 Micro-sweep across x in [0.259000, 0.261000]
    for (float x = 0.259000f; x < 0.259999f; x += 0.0001f) {
        bool hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, x, 0.5f);
        assert(!hit && "Deadband zone (0.200708..0.260000) must not trigger any button");
        assert(g_touch.move_finger == -1 && g_touch.look_finger == -1);
    }

    // At x = 0.260000
    bool hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.260000f, 0.5f);
    assert(hit && "x=0.260000 must trigger look");
    assert(g_touch.look_finger == 0 && g_touch.move_finger == -1);
    Touch_ButtonPress(&g_touch.list_user, event_up, 0, 0.260000f, 0.5f);
    assert(g_touch.look_finger == -1);

    // 2.2 Slide across partition: Finger starts on joy (x=0.12), drags across to x=0.80
    hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.120354f, 0.510000f);
    assert(hit && g_touch.move_finger == 0);
    // Motion to x = 0.80
    Touch_Motion(0, 0.800000f, 0.510000f, 0.68f, 0.0f);
    assert(g_touch.move_finger == 0 && "move_finger must stay 0");
    assert(g_touch.look_finger == -1 && "look_finger must remain unassigned");
    assert(g_touch.yaw == 0.0f && g_touch.pitch == 0.0f && "Look must not rotate when joy finger slides across");

    Touch_ButtonPress(&g_touch.list_user, event_up, 0, 0.800000f, 0.510000f);
    assert(g_touch.move_finger == -1);

    // 2.3 Slide right to left: Finger starts on look (x=0.50), drags across to x=0.05
    hit = Touch_ButtonPress(&g_touch.list_user, event_down, 1, 0.500000f, 0.500000f);
    assert(hit && g_touch.look_finger == 1);
    Touch_Motion(1, 0.050000f, 0.500000f, -0.45f, 0.0f);
    assert(g_touch.look_finger == 1 && "look_finger must stay 1");
    assert(g_touch.move_finger == -1 && "move_finger must remain unassigned");
    assert(g_touch.forward == 0.0f && g_touch.side == 0.0f && "Joy must not activate when look finger slides left");

    Touch_ButtonPress(&g_touch.list_user, event_up, 1, 0.050000f, 0.500000f);
    assert(g_touch.look_finger == -1);
    printf("[PASS] Test_Partition_At_026_Deadband\n");
}

// ----------------------------------------------------------------------------
// Test 3: High-frequency alternating buttons & break verification
// ----------------------------------------------------------------------------
static void Test_HighFreq_Alternating_Buttons(void) {
    Touch_Reset();
    Touch_FreeList(&g_touch.list_user);

    Touch_AddButton(&g_touch.list_user, "look", "_look", 0.26f, 0.0f, 1.0f, 1.0f, 0);
    Touch_AddButton(&g_touch.list_user, "fire", "+attack", 0.74f, 0.38f, 0.823333f, 0.680752f, 0);
    Touch_AddButton(&g_touch.list_user, "jump", "+jump 73", 0.86f, 0.12f, 0.930833f, 0.375639f, 0);

    // Run 50,000 iterations of rapid alternating presses and releases
    for (int i = 0; i < 50000; i++) {
        // Finger 0 presses fire
        bool hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.78f, 0.50f);
        assert(hit && "fire must hit");
        assert(g_touch.look_finger == -1 && "fire must NOT take over look!");
        assert(!strcmp(g_last_command, "+attack\n"));

        // Finger 1 presses jump
        hit = Touch_ButtonPress(&g_touch.list_user, event_down, 1, 0.89f, 0.25f);
        assert(hit && "jump must hit");
        assert(g_touch.look_finger == -1 && "jump must NOT take over look!");
        assert(!strcmp(g_last_command, "+jump 73\n"));

        // Finger 0 releases fire
        hit = Touch_ButtonPress(&g_touch.list_user, event_up, 0, 0.78f, 0.50f);
        assert(hit && "fire release must hit");
        assert(!strcmp(g_last_command, "-attack\n"));

        // Finger 1 releases jump
        hit = Touch_ButtonPress(&g_touch.list_user, event_up, 1, 0.89f, 0.25f);
        assert(hit && "jump release must hit");
        assert(!strcmp(g_last_command, "-jump 73\n"));
    }
    printf("[PASS] Test_HighFreq_Alternating_Buttons (50,000 iterations)\n");
}

// ----------------------------------------------------------------------------
// Test 4: Concurrency: Rapid cjump spam while holding joy
// ----------------------------------------------------------------------------
static void Test_CJump_Spam_While_Holding_Joy(void) {
    Touch_Reset();
    Touch_FreeList(&g_touch.list_user);

    Touch_AddButton(&g_touch.list_user, "look", "_look", 0.26f, 0.0f, 1.0f, 1.0f, 0);
    Touch_AddButton(&g_touch.list_user, "joy", "_joy", 0.040000f, 0.220000f, 0.200708f, 0.800000f, TOUCH_FL_STICK);
    Touch_AddButton(&g_touch.list_user, "cjump", "+cjump", 0.140000f, 0.015000f, 0.192083f, 0.202970f, 0);

    // Finger 0 holds joy
    bool hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.120354f, 0.400000f);
    assert(hit && g_touch.move_finger == 0);
    assert(g_touch.forward > 0.0f);

    // Finger 1 spams cjump 10,000 times
    for (int i = 0; i < 10000; i++) {
        hit = Touch_ButtonPress(&g_touch.list_user, event_down, 1, 0.160000f, 0.100000f);
        assert(hit && "cjump down hit");
        assert(!strcmp(g_last_command, "+cjump\n"));
        assert(g_touch.move_finger == 0 && "joy move_finger MUST NOT be affected by cjump down!");
        assert(g_touch.look_finger == -1 && "look_finger must remain -1");

        // Joy finger moves while cjump is held
        Touch_Motion(0, 0.150000f, 0.350000f, 0.01f, -0.05f);
        assert(g_touch.move_finger == 0);

        hit = Touch_ButtonPress(&g_touch.list_user, event_up, 1, 0.160000f, 0.100000f);
        assert(hit && "cjump up hit");
        assert(!strcmp(g_last_command, "-cjump\n"));
        assert(g_touch.move_finger == 0 && "joy move_finger MUST NOT be affected by cjump up break;!");
    }

    // Release joy
    hit = Touch_ButtonPress(&g_touch.list_user, event_up, 0, 0.150000f, 0.350000f);
    (void)hit; // Note: In upstream Xash3D, event_up for touch_joy/move/look does not set result=true (returns false), but cleanly resets move_finger to -1
    assert(g_touch.move_finger == -1 && "joy move_finger MUST be reset to -1 on release");
    assert(g_touch.forward == 0.0f && g_touch.side == 0.0f && "joy forward/side MUST be reset to 0 on release");
    printf("[PASS] Test_CJump_Spam_While_Holding_Joy (10,000 iterations)\n");
}

// ----------------------------------------------------------------------------
// Test 5: TOUCH_FL_PRECISION flag set/reset with break;
// ----------------------------------------------------------------------------
static void Test_Precision_Flag_With_Break(void) {
    Touch_Reset();
    Touch_FreeList(&g_touch.list_user);

    Touch_AddButton(&g_touch.list_user, "look", "_look", 0.26f, 0.0f, 1.0f, 1.0f, 0);
    // Precision aim button (e.g., sniper zoom button)
    Touch_AddButton(&g_touch.list_user, "aim_prec", "+aim", 0.60f, 0.60f, 0.68f, 0.80f, TOUCH_FL_PRECISION);
    Touch_AddButton(&g_touch.list_user, "fire", "+attack", 0.74f, 0.38f, 0.823333f, 0.680752f, 0);

    // Initial state
    assert(!g_touch.precision);

    // Finger 0 presses aim_prec
    bool hit = Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.64f, 0.70f);
    assert(hit);
    assert(g_touch.precision && "precision flag MUST be set to true on down");
    assert(g_touch.look_finger == -1);

    // Finger 1 looks around
    hit = Touch_ButtonPress(&g_touch.list_user, event_down, 1, 0.40f, 0.50f);
    assert(hit && g_touch.look_finger == 1);

    float initial_yaw = g_touch.yaw;
    Touch_Motion(1, 0.41f, 0.50f, 0.01f, 0.0f);
    // When precision is true, dx is multiplied by 0.5 -> yaw delta = -0.01 * 0.5 * 120 = -0.60
    float expected_delta = -0.01f * 0.5f * 120.0f;
    assert(fabsf((g_touch.yaw - initial_yaw) - expected_delta) < 0.0001f);

    // Finger 0 releases aim_prec
    hit = Touch_ButtonPress(&g_touch.list_user, event_up, 0, 0.64f, 0.70f);
    assert(hit);
    assert(!g_touch.precision && "precision flag MUST be reset to false on up (break; must not skip it)");

    // Finger 1 continues to look around
    initial_yaw = g_touch.yaw;
    Touch_Motion(1, 0.42f, 0.50f, 0.01f, 0.0f);
    // When precision is false, dx is NOT scaled -> yaw delta = -0.01 * 120 = -1.20
    expected_delta = -0.01f * 120.0f;
    assert(fabsf((g_touch.yaw - initial_yaw) - expected_delta) < 0.0001f);

    // Release look
    Touch_ButtonPress(&g_touch.list_user, event_up, 1, 0.42f, 0.50f);
    assert(g_touch.look_finger == -1);
    printf("[PASS] Test_Precision_Flag_With_Break\n");
}

// ----------------------------------------------------------------------------
// Test 6: Full touch.cfg production layout adversarial verification
// ----------------------------------------------------------------------------
static void Test_Full_Touch_Cfg_Layout_Adversarial(void) {
    Touch_Reset();
    Touch_FreeList(&g_touch.list_user);

    // Exact definitions from touch.cfg in registration order:
    Touch_AddButton(&g_touch.list_user, "look", "_look", 0.260000f, 0.000000f, 1.000000f, 1.000000f, 0);
    Touch_AddButton(&g_touch.list_user, "joy", "_joy", 0.040000f, 0.220000f, 0.200708f, 0.800000f, TOUCH_FL_STICK);
    Touch_AddButton(&g_touch.list_user, "crouch", "+duck 71", 0.040000f, 0.015000f, 0.092083f, 0.202970f, TOUCH_FL_COMMAND_LATCH);
    Touch_AddButton(&g_touch.list_user, "cjump", "+cjump", 0.140000f, 0.015000f, 0.192083f, 0.202970f, 0);
    Touch_AddButton(&g_touch.list_user, "quicksave", "save quick", 0.280000f, 0.020000f, 0.325833f, 0.185414f, 0);
    Touch_AddButton(&g_touch.list_user, "quickload", "load quick", 0.340000f, 0.020000f, 0.385833f, 0.185414f, 0);
    Touch_AddButton(&g_touch.list_user, "show_numbers", "exec touch_numbers.cfg", 0.400000f, 0.020000f, 0.445833f, 0.185414f, 0);
    Touch_AddButton(&g_touch.list_user, "flashlight", "impulse 100", 0.460000f, 0.020000f, 0.505833f, 0.185414f, 0);
    Touch_AddButton(&g_touch.list_user, "menu", "cancelselect", 0.520000f, 0.020000f, 0.565833f, 0.185414f, 0);
    Touch_AddButton(&g_touch.list_user, "prev", "invprev", 0.730000f, 0.020000f, 0.775833f, 0.185414f, 0);
    Touch_AddButton(&g_touch.list_user, "next", "invnext", 0.790000f, 0.020000f, 0.835833f, 0.185414f, 0);
    Touch_AddButton(&g_touch.list_user, "reload", "+reload", 0.650000f, 0.230000f, 0.712500f, 0.455564f, 0);
    Touch_AddButton(&g_touch.list_user, "alt_fire", "+attack2", 0.650000f, 0.530000f, 0.712500f, 0.755564f, 0);
    Touch_AddButton(&g_touch.list_user, "fire", "+attack", 0.740000f, 0.380000f, 0.823333f, 0.680752f, 0);
    Touch_AddButton(&g_touch.list_user, "jump", "+jump 73", 0.860000f, 0.120000f, 0.930833f, 0.375639f, 0);
    Touch_AddButton(&g_touch.list_user, "use", "+use", 0.860000f, 0.500000f, 0.930833f, 0.755639f, 0);

    // 6.1 Test every single foreground button: ensure it triggers command and NEVER steals look
    const char *action_names[] = {
        "cjump", "quicksave", "quickload", "show_numbers", "flashlight",
        "menu", "prev", "next", "reload", "alt_fire", "fire", "jump", "use"
    };
    int count = sizeof(action_names) / sizeof(action_names[0]);

    for (int i = 0; i < count; i++) {
        touch_button_t *btn = NULL;
        for (touch_button_t *b = g_touch.list_user.first; b; b = b->next) {
            if (!strcmp(b->name, action_names[i])) {
                btn = b;
                break;
            }
        }
        assert(btn != NULL);

        float cx = (btn->x1 + btn->x2) * 0.5f;
        float cy = (btn->y1 + btn->y2) * 0.5f;

        // Down
        bool hit = Touch_ButtonPress(&g_touch.list_user, event_down, 1, cx, cy);
        assert(hit && "Button press must succeed");
        assert(btn->finger == 1);
        assert(g_touch.look_finger == -1 && "Action button must NEVER steal look_finger due to break;!");

        // Finger drifts far away (e.g., 0.05, 0.05) and lifts
        hit = Touch_ButtonPress(&g_touch.list_user, event_up, 1, 0.05f, 0.05f);
        assert(hit && "Drift-off release must succeed");
        assert(btn->finger == -1);
        assert(g_touch.look_finger == -1);
    }

    // 6.2 Test crouch (TOUCH_FL_COMMAND_LATCH)
    touch_button_t *crouch_btn = NULL;
    for (touch_button_t *b = g_touch.list_user.first; b; b = b->next) {
        if (!strcmp(b->name, "crouch")) crouch_btn = b;
    }
    assert(crouch_btn != NULL);
    float cx = (crouch_btn->x1 + crouch_btn->x2) * 0.5f;
    float cy = (crouch_btn->y1 + crouch_btn->y2) * 0.5f;

    // Press 1: Latch down
    Touch_ButtonPress(&g_touch.list_user, event_down, 1, cx, cy);
    assert(crouch_btn->latched);
    assert(!strcmp(g_last_command, "+duck 71\n"));
    Touch_ButtonPress(&g_touch.list_user, event_up, 1, cx, cy);
    assert(crouch_btn->latched && "Latched button must stay latched on event_up");

    // Press 2: Release latch
    Touch_ButtonPress(&g_touch.list_user, event_down, 1, cx, cy);
    assert(!crouch_btn->latched);
    assert(!strcmp(g_last_command, "-duck 71\n"));
    Touch_ButtonPress(&g_touch.list_user, event_up, 1, cx, cy);
    assert(!crouch_btn->latched);

    // 6.3 Test 3-finger simultaneous interaction:
    // Slot 0: joy (moving forward-right)
    // Slot 1: look (sliding view)
    // Slot 2: fire (attacking)
    Touch_ButtonPress(&g_touch.list_user, event_down, 0, 0.15f, 0.40f);
    assert(g_touch.move_finger == 0);

    Touch_ButtonPress(&g_touch.list_user, event_down, 1, 0.50f, 0.50f);
    assert(g_touch.look_finger == 1);

    Touch_ButtonPress(&g_touch.list_user, event_down, 2, 0.78f, 0.50f);
    assert(!strcmp(g_last_command, "+attack\n"));
    assert(g_touch.look_finger == 1 && "fire down must NOT override look_finger 1!");
    assert(g_touch.move_finger == 0 && "fire down must NOT override move_finger 0!");

    // Simultaneous motion on all 3 fingers
    Touch_Motion(0, 0.16f, 0.38f, 0.01f, -0.02f);
    Touch_Motion(1, 0.52f, 0.48f, 0.02f, -0.02f);
    Touch_Motion(2, 0.79f, 0.51f, 0.01f, 0.01f); // Fire finger micro-jitter

    // Look yaw must have moved by finger 1, but NOT finger 2
    assert(g_touch.yaw != 0.0f);
    float yaw_snapshot = g_touch.yaw;
    Touch_Motion(2, 0.80f, 0.52f, 0.01f, 0.01f);
    assert(g_touch.yaw == yaw_snapshot && "Finger 2 on fire must NOT alter yaw!");

    // Out-of-order release: Slot 2 (fire) lifts first, Slot 0 (joy) lifts second, Slot 1 (look) lifts third
    Touch_ButtonPress(&g_touch.list_user, event_up, 2, 0.80f, 0.52f);
    assert(!strcmp(g_last_command, "-attack\n"));
    assert(g_touch.look_finger == 1);
    assert(g_touch.move_finger == 0);

    Touch_ButtonPress(&g_touch.list_user, event_up, 0, 0.16f, 0.38f);
    assert(g_touch.move_finger == -1);
    assert(g_touch.look_finger == 1);

    Touch_ButtonPress(&g_touch.list_user, event_up, 1, 0.52f, 0.48f);
    assert(g_touch.look_finger == -1);

    printf("[PASS] Test_Full_Touch_Cfg_Layout_Adversarial\n");
}

int main(void) {
    printf("=== Starting Native Adversarial Touch Engine Harness Tests ===\n");
    Test_Boundary_HUD_Clearance();
    Test_Partition_At_026_Deadband();
    Test_HighFreq_Alternating_Buttons();
    Test_CJump_Spam_While_Holding_Joy();
    Test_Precision_Flag_With_Break();
    Test_Full_Touch_Cfg_Layout_Adversarial();
    printf("=== All 6 Adversarial Harness Suites Passed Successfully ===\n");
    return 0;
}
