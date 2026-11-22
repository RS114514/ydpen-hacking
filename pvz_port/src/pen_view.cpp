#include "pen_view.hpp"
#include <algorithm>
#include <cstdlib>

namespace pen {
namespace {
bool inside(Point p, Rect r) {
    return p.x >= r.x && p.y >= r.y && p.x < r.x + r.width && p.y < r.y + r.height;
}
int manhattan(Point a, Point b) {
    return std::abs(a.x - b.x) + std::abs(a.y - b.y);
}
constexpr char keys[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
constexpr int kZoomSrcW = 161;
constexpr int kZoomSrcH = 95;
constexpr int kTapSlop = 8;
constexpr int kSceneTapSlop = 18;
}

Rect View::cardRect(int index) {
    return {8 + (index % 3) * 82, 44 + (index / 3) * 82, 76, 76};
}
Rect View::shortcutRect(int index) {
    return {8 + (index % 2) * 124, 44 + (index / 2) * 82, 116, 76};
}
Rect View::keyboardKeyRect(int index) { return {8 + index % 6 * 158, 8 + index / 6 * 96, 150, 88}; }
Rect View::keyboardControlRect(int index) { return {8 + index * 190, 206, 182, 52}; }

// Always expose the full 800x600 game canvas without top/bottom cropping.
Rect View::sceneSource() const { return Rect{0, 0, 800, 600}; }
Rect View::sceneViewport() const { return Rect{262, 0, 354, 266}; }

Rect View::zoomSource() const {
    return {
        std::clamp(cursor_.x - kZoomSrcW / 2, 0, 800 - kZoomSrcW),
        std::clamp(cursor_.y - kZoomSrcH / 2, 0, 600 - kZoomSrcH),
        kZoomSrcW,
        kZoomSrcH
    };
}

void View::setCardCount(int count) {
    cardCount_ = std::clamp(count, 0, 10);
    cardPage_ = std::min(cardPage_, std::max(0, (cardCount_ - 1) / 6));
}

int View::hit(Point point) const {
    if (keyboard_) {
        for (int i = 0; i < 12; ++i)
            if (inside(point, keyboardKeyRect(i))) return 100 + i;
        for (int i = 0; i < 5; ++i)
            if (inside(point, keyboardControlRect(i))) return 120 + i;
        return -1;
    }
    if (inside(point, sceneViewport())) return 0;
    if (inside(point, zoomViewport)) return 1;
    if (inside(point, confirmButton)) return 2;
    if (inside(point, cancelButton)) return 3;
    if (inside(point, autoButton)) return 4;
    if (inside(point, kbButton)) return 5;
    if (cards_) {
        for (int i = 0; i < 6; ++i)
            if (inside(point, cardRect(i))) return 10 + i;
    } else {
        for (int i = 0; i < 4; ++i)
            if (inside(point, shortcutRect(i))) return 20 + i;
    }
    if (inside(point, menuButton)) return 30;
    if (inside(point, pauseButton)) return 31;
    if (inside(point, shovelButton)) return 32;
    if (inside(point, pageButton)) return 33;
    return -1;
}

void View::aim(Point point, Rect viewport, Rect source) {
    if (const auto target = screenToSource(point, viewport, source)) {
        cursor_ = *target;
        cursorFx_ = static_cast<float>(cursor_.x);
        cursorFy_ = static_cast<float>(cursor_.y);
        pending_ = true;
    }
}

void View::press(Point point) {
    pressed_ = hit(point);
    if (pressed_ == 0) {
        sceneStartTouch_ = point;
        sceneMaxDist_ = 0;
        aim(point, sceneViewport(), sceneSource());
    } else if (pressed_ == 1) {
        lastZoomTouch_ = point;
        zoomStartTouch_ = point;
        zoomMaxDist_ = 0;
        cursorFx_ = static_cast<float>(cursor_.x);
        cursorFy_ = static_cast<float>(cursor_.y);
        pending_ = true;
    }
}

void View::move(Point point) {
    if (pressed_ == 0) {
        sceneMaxDist_ = std::max(sceneMaxDist_, manhattan(point, sceneStartTouch_));
        aim(point, sceneViewport(), sceneSource());
    } else if (pressed_ == 1) {
        zoomMaxDist_ = std::max(zoomMaxDist_, manhattan(point, zoomStartTouch_));
        const float dx = static_cast<float>(point.x - lastZoomTouch_.x);
        const float dy = static_cast<float>(point.y - lastZoomTouch_.y);
        lastZoomTouch_ = point;
        if (dx != 0.0f || dy != 0.0f) {
            const float stepDist = std::abs(dx) + std::abs(dy);
            const float gain = (stepDist > 5.0f) ? 1.5f : 1.2f;
            cursorFx_ = std::clamp(cursorFx_ + dx * gain, 0.0f, 799.0f);
            cursorFy_ = std::clamp(cursorFy_ + dy * gain, 0.0f, 599.0f);
            cursor_.x = static_cast<int>(cursorFx_ + 0.5f);
            cursor_.y = static_cast<int>(cursorFy_ + 0.5f);
            pending_ = true;
        }
    }
}

Action View::release(Point point) {
    move(point);
    const int button = pressed_;
    const bool same = button >= 0 && button == hit(point);
    pressed_ = -1;
    if (!same) return {};

    // In non-battle menus/chooser/dialogs, tapping the canvas directly clicks.
    // During battle gameplay, canvas touch only aims so the player never misclicks.
    if (button == 0) {
        if (!battle_ && sceneMaxDist_ <= kSceneTapSlop) {
            pending_ = false;
            return {ActionKind::Click, cursor_};
        }
        return {};
    }

    // Touchpad: single tap without dragging triggers left-click at current cursor;
    // dragging/sliding moves the cursor without clicking.
    if (button == 1) {
        if (zoomMaxDist_ <= kTapSlop) {
            pending_ = false;
            return {ActionKind::Click, cursor_};
        }
        return {};
    }

    // OK always confirms a left-click at current cursor, allowing consecutive clicks.
    if (button == 2) {
        pending_ = false;
        return {ActionKind::Click, cursor_};
    }

    if (button == 3) {
        pending_ = false;
        return {ActionKind::Cancel, cursor_};
    }
    if (button == 4) return {ActionKind::ToggleAuto};
    if (button == 5) {
        keyboard_ = !keyboard_;
        return {};
    }
    if (button >= 10 && button < 16) {
        const int slot = cardPage_ * 6 + (button - 10);
        if (slot < cardCount_) {
            pending_ = false;
            return {ActionKind::Card, {}, slot};
        }
        return {};
    }
    switch (button) {
        case 20: pending_ = false; return {ActionKind::Escape};
        case 21: pending_ = false; return {ActionKind::ReturnKey};
        case 22: keyboard_ = !keyboard_; break;
        case 23:
            cursor_ = {400, 300};
            cursorFx_ = 400.0f;
            cursorFy_ = 300.0f;
            pending_ = true;
            break;
        case 30: pending_ = false; return {ActionKind::Menu};
        case 31: pending_ = false; return {ActionKind::Space};
        case 32: pending_ = false; return {ActionKind::Shovel};
        case 33:
            if (cards_ && cardCount_ > 6) {
                cardPage_ = (cardPage_ + 1) % ((cardCount_ + 5) / 6);
            } else {
                cursor_ = {400, 300};
                cursorFx_ = 400.0f;
                cursorFy_ = 300.0f;
                pending_ = true;
            }
            break;
        case 120: keyboard_ = false; break;
        case 121: keyboardPage_ = (keyboardPage_ + 1) % 3; break;
        case 122: return {ActionKind::Backspace};
        case 123: return {ActionKind::Character, {}, ' '};
        case 124: keyboard_ = false; return {ActionKind::Enter};
        default: break;
    }
    if (button >= 100 && button < 112)
        return {ActionKind::Character, {}, keys[keyboardPage_ * 12 + button - 100]};
    return {};
}

void View::cancel() {
    pending_ = false;
    pressed_ = -1;
    keyboard_ = false;
}
}
