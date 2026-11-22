use ruffle_core::events::{
    KeyDescriptor, KeyLocation, LogicalKey, MouseButton, NamedKey, PhysicalKey, PlayerEvent,
};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use winit::event::{Touch, TouchPhase};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BvnKey {
    W = 0,
    A = 1,
    S = 2,
    D = 3,
    J = 4,
    K = 5,
    L = 6,
    U = 7,
    I = 8,
    O = 9,
    Enter = 10,
    Escape = 11,
}

impl BvnKey {
    const ALL: [BvnKey; 12] = [
        BvnKey::W,
        BvnKey::A,
        BvnKey::S,
        BvnKey::D,
        BvnKey::J,
        BvnKey::K,
        BvnKey::L,
        BvnKey::U,
        BvnKey::I,
        BvnKey::O,
        BvnKey::Enter,
        BvnKey::Escape,
    ];

    fn descriptor(self) -> KeyDescriptor {
        let (physical_key, logical_key) = match self {
            BvnKey::W => (PhysicalKey::KeyW, LogicalKey::Character('w')),
            BvnKey::A => (PhysicalKey::KeyA, LogicalKey::Character('a')),
            BvnKey::S => (PhysicalKey::KeyS, LogicalKey::Character('s')),
            BvnKey::D => (PhysicalKey::KeyD, LogicalKey::Character('d')),
            BvnKey::J => (PhysicalKey::KeyJ, LogicalKey::Character('j')),
            BvnKey::K => (PhysicalKey::KeyK, LogicalKey::Character('k')),
            BvnKey::L => (PhysicalKey::KeyL, LogicalKey::Character('l')),
            BvnKey::U => (PhysicalKey::KeyU, LogicalKey::Character('u')),
            BvnKey::I => (PhysicalKey::KeyI, LogicalKey::Character('i')),
            BvnKey::O => (PhysicalKey::KeyO, LogicalKey::Character('o')),
            BvnKey::Enter => (PhysicalKey::Enter, LogicalKey::Named(NamedKey::Enter)),
            BvnKey::Escape => (PhysicalKey::Escape, LogicalKey::Named(NamedKey::Escape)),
        };
        KeyDescriptor {
            physical_key,
            logical_key,
            key_location: KeyLocation::Standard,
        }
    }
}

#[derive(Clone, Copy)]
struct ButtonRect {
    key: BvnKey,
    label: &'static str,
    sub: &'static str,
    x: f32,
    y: f32,
    w: f32,
    h: f32,
}

const BUTTONS: [ButtonRect; 8] = [
    ButtonRect { key: BvnKey::Escape, label: "ESC", sub: "MENU", x: 14.0, y: 14.0, w: 132.0, h: 44.0 },
    ButtonRect { key: BvnKey::Enter, label: "OK", sub: "START", x: 814.0, y: 14.0, w: 132.0, h: 44.0 },
    ButtonRect { key: BvnKey::U, label: "U", sub: "SKILL", x: 808.0, y: 82.0, w: 70.0, h: 114.0 },
    ButtonRect { key: BvnKey::I, label: "I", sub: "ULT", x: 884.0, y: 82.0, w: 70.0, h: 114.0 },
    ButtonRect { key: BvnKey::J, label: "J", sub: "ATK", x: 808.0, y: 210.0, w: 70.0, h: 114.0 },
    ButtonRect { key: BvnKey::K, label: "K", sub: "JUMP", x: 884.0, y: 210.0, w: 70.0, h: 114.0 },
    ButtonRect { key: BvnKey::L, label: "L", sub: "DASH", x: 808.0, y: 338.0, w: 70.0, h: 114.0 },
    ButtonRect { key: BvnKey::O, label: "O", sub: "HELP", x: 884.0, y: 338.0, w: 70.0, h: 114.0 },
];

const DPAD_CX: f32 = 80.0;
const DPAD_CY: f32 = 282.0;
const DPAD_RADIUS: f32 = 66.0;
const DPAD_DEADZONE: f32 = 16.0;

#[derive(Clone, Copy)]
enum TouchTarget {
    Button(BvnKey),
    DPad { dx: f32, dy: f32 },
    StageMouse,
}

static PRESSED_MASK: AtomicU32 = AtomicU32::new(0);
static STICK_DX_BITS: AtomicU32 = AtomicU32::new(0);
static STICK_DY_BITS: AtomicU32 = AtomicU32::new(0);

pub fn is_enabled() -> bool {
    std::env::var_os("BVN_TOUCH").is_some_and(|v| v == "1")
}

pub struct BvnGamepad {
    touches: HashMap<u64, TouchTarget>,
    prev_mask: u32,
}

impl BvnGamepad {
    pub fn new() -> Self {
        Self {
            touches: HashMap::new(),
            prev_mask: 0,
        }
    }

    fn hit_test(lx: f32, ly: f32) -> TouchTarget {
        for btn in &BUTTONS {
            if lx >= btn.x && lx <= btn.x + btn.w && ly >= btn.y && ly <= btn.y + btn.h {
                return TouchTarget::Button(btn.key);
            }
        }
        if lx < 160.0 && ly >= 70.0 {
            return Self::dpad_vec(lx, ly);
        }
        if (160.0..=800.0).contains(&lx) {
            return TouchTarget::StageMouse;
        }
        TouchTarget::StageMouse
    }

    fn dpad_vec(lx: f32, ly: f32) -> TouchTarget {
        let mut dx = (lx - DPAD_CX) / DPAD_RADIUS;
        let mut dy = (ly - DPAD_CY) / DPAD_RADIUS;
        let len = (dx * dx + dy * dy).sqrt();
        if len > 1.0 {
            dx /= len;
            dy /= len;
        }
        TouchTarget::DPad { dx, dy }
    }

    pub fn handle_touch(
        &mut self,
        touch: Touch,
        win_w: f64,
        win_h: f64,
        movie_pos: (f64, f64),
    ) -> Vec<PlayerEvent> {
        let mut events = Vec::new();
        if win_w <= 0.0 || win_h <= 0.0 {
            return events;
        }

        let lx = (touch.location.x / win_w * 960.0) as f32;
        let ly = (touch.location.y / win_h * 480.0) as f32;

        match touch.phase {
            TouchPhase::Started => {
                let target = Self::hit_test(lx, ly);
                self.touches.insert(touch.id, target);
                if matches!(target, TouchTarget::StageMouse) {
                    events.push(PlayerEvent::MouseMove {
                        x: movie_pos.0,
                        y: movie_pos.1,
                    });
                    events.push(PlayerEvent::MouseDown {
                        x: movie_pos.0,
                        y: movie_pos.1,
                        button: MouseButton::Left,
                        index: Some(0),
                    });
                }
            }
            TouchPhase::Moved => {
                if let Some(prev) = self.touches.get_mut(&touch.id) {
                    match prev {
                        TouchTarget::DPad { .. } => {
                            *prev = Self::dpad_vec(lx, ly);
                        }
                        TouchTarget::StageMouse => {
                            events.push(PlayerEvent::MouseMove {
                                x: movie_pos.0,
                                y: movie_pos.1,
                            });
                        }
                        TouchTarget::Button(prev_key) => {
                            let new_target = Self::hit_test(lx, ly);
                            if let TouchTarget::Button(k) = new_target {
                                *prev_key = k;
                            }
                        }
                    }
                }
            }
            TouchPhase::Ended | TouchPhase::Cancelled => {
                if let Some(TouchTarget::StageMouse) = self.touches.remove(&touch.id) {
                    events.push(PlayerEvent::MouseUp {
                        x: movie_pos.0,
                        y: movie_pos.1,
                        button: MouseButton::Left,
                    });
                }
            }
        }

        let mut new_mask: u32 = 0;
        let mut stick_dx: f32 = 0.0;
        let mut stick_dy: f32 = 0.0;
        let dead_norm = DPAD_DEADZONE / DPAD_RADIUS;

        for target in self.touches.values() {
            match *target {
                TouchTarget::Button(k) => {
                    new_mask |= 1 << (k as u32);
                }
                TouchTarget::DPad { dx, dy } => {
                    stick_dx = dx;
                    stick_dy = dy;
                    if dy < -dead_norm {
                        new_mask |= 1 << (BvnKey::W as u32);
                    }
                    if dy > dead_norm {
                        new_mask |= 1 << (BvnKey::S as u32);
                    }
                    if dx < -dead_norm {
                        new_mask |= 1 << (BvnKey::A as u32);
                    }
                    if dx > dead_norm {
                        new_mask |= 1 << (BvnKey::D as u32);
                    }
                }
                TouchTarget::StageMouse => {}
            }
        }

        PRESSED_MASK.store(new_mask, Ordering::Relaxed);
        STICK_DX_BITS.store(stick_dx.to_bits(), Ordering::Relaxed);
        STICK_DY_BITS.store(stick_dy.to_bits(), Ordering::Relaxed);

        for k in BvnKey::ALL {
            let bit = 1 << (k as u32);
            let was = (self.prev_mask & bit) != 0;
            let now = (new_mask & bit) != 0;
            if !was && now {
                events.push(PlayerEvent::KeyDown {
                    key: k.descriptor(),
                });
            } else if was && !now {
                events.push(PlayerEvent::KeyUp {
                    key: k.descriptor(),
                });
            }
        }
        self.prev_mask = new_mask;
        events
    }
}

pub fn draw_overlay(ctx: &egui::Context, screen_rect: egui::Rect) {
    if !is_enabled() {
        return;
    }

    let sx = screen_rect.width() / 960.0;
    let sy = screen_rect.height() / 480.0;
    let mask = PRESSED_MASK.load(Ordering::Relaxed);
    let stick_dx = f32::from_bits(STICK_DX_BITS.load(Ordering::Relaxed));
    let stick_dy = f32::from_bits(STICK_DY_BITS.load(Ordering::Relaxed));

    let painter = ctx.layer_painter(egui::LayerId::new(
        egui::Order::Foreground,
        egui::Id::new("bvn_gamepad_overlay"),
    ));

    // Subtle sidebar backgrounds
    let bg_color = egui::Color32::from_rgb(14, 16, 22);
    painter.rect_filled(
        egui::Rect::from_min_max(
            egui::pos2(0.0, 0.0),
            egui::pos2(160.0 * sx, 480.0 * sy),
        ),
        0.0,
        bg_color,
    );
    painter.rect_filled(
        egui::Rect::from_min_max(
            egui::pos2(800.0 * sx, 0.0),
            egui::pos2(960.0 * sx, 480.0 * sy),
        ),
        0.0,
        bg_color,
    );

    // D-Pad outer ring & cross
    let cx = DPAD_CX * sx;
    let cy = DPAD_CY * sy;
    let r = DPAD_RADIUS * sx.min(sy);
    painter.circle_filled(
        egui::pos2(cx, cy),
        r,
        egui::Color32::from_rgba_unmultiplied(36, 42, 56, 220),
    );
    painter.circle_stroke(
        egui::pos2(cx, cy),
        r,
        egui::Stroke::new(2.0, egui::Color32::from_rgb(88, 102, 130)),
    );

    // Direction labels
    let dir_color = |k: BvnKey| {
        if (mask & (1 << (k as u32))) != 0 {
            egui::Color32::from_rgb(255, 196, 64)
        } else {
            egui::Color32::from_rgb(160, 172, 194)
        }
    };
    let font_dir = egui::FontId::proportional(14.0 * sy);
    painter.text(egui::pos2(cx, cy - r * 0.68), egui::Align2::CENTER_CENTER, "W", font_dir.clone(), dir_color(BvnKey::W));
    painter.text(egui::pos2(cx, cy + r * 0.68), egui::Align2::CENTER_CENTER, "S", font_dir.clone(), dir_color(BvnKey::S));
    painter.text(egui::pos2(cx - r * 0.68, cy), egui::Align2::CENTER_CENTER, "A", font_dir.clone(), dir_color(BvnKey::A));
    painter.text(egui::pos2(cx + r * 0.68, cy), egui::Align2::CENTER_CENTER, "D", font_dir, dir_color(BvnKey::D));

    // Virtual thumbstick knob
    let knob_x = cx + stick_dx * r * 0.55;
    let knob_y = cy + stick_dy * r * 0.55;
    let stick_active = (mask & 0b1111) != 0;
    painter.circle_filled(
        egui::pos2(knob_x, knob_y),
        r * 0.34,
        if stick_active {
            egui::Color32::from_rgb(245, 158, 11)
        } else {
            egui::Color32::from_rgb(70, 82, 104)
        },
    );

    // Action & utility buttons
    for btn in &BUTTONS {
        let pressed = (mask & (1 << (btn.key as u32))) != 0;
        let rect = egui::Rect::from_min_size(
            egui::pos2(btn.x * sx, btn.y * sy),
            egui::vec2(btn.w * sx, btn.h * sy),
        );
        let fill = if pressed {
            egui::Color32::from_rgb(234, 88, 12)
        } else if btn.key == BvnKey::I {
            egui::Color32::from_rgb(92, 34, 46)
        } else if btn.key == BvnKey::J {
            egui::Color32::from_rgb(38, 66, 104)
        } else {
            egui::Color32::from_rgb(36, 42, 56)
        };
        let stroke_color = if pressed {
            egui::Color32::from_rgb(255, 220, 140)
        } else {
            egui::Color32::from_rgb(92, 106, 134)
        };
        painter.rect_filled(rect, 10.0, fill);
        painter.rect_stroke(
            rect,
            10.0,
            egui::Stroke::new(1.5, stroke_color),
            egui::StrokeKind::Inside,
        );
        if btn.h > 60.0 {
            painter.text(
                egui::pos2(rect.center().x, rect.center().y - 10.0 * sy),
                egui::Align2::CENTER_CENTER,
                btn.label,
                egui::FontId::proportional(24.0 * sy),
                egui::Color32::WHITE,
            );
            painter.text(
                egui::pos2(rect.center().x, rect.center().y + 18.0 * sy),
                egui::Align2::CENTER_CENTER,
                btn.sub,
                egui::FontId::proportional(11.0 * sy),
                egui::Color32::from_rgb(195, 205, 222),
            );
        } else {
            painter.text(
                rect.center(),
                egui::Align2::CENTER_CENTER,
                btn.label,
                egui::FontId::proportional(16.0 * sy),
                egui::Color32::WHITE,
            );
        }
    }
}
