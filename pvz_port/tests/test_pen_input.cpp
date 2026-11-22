#include "pen_input.hpp"
#include <cstdio>
#include <cstdlib>

static int assertions = 0;
static void require(bool condition, const char* message) {
    ++assertions;
    if (!condition) {
        std::fprintf(stderr, "FAIL: %s\n", message);
        std::exit(1);
    }
}

int main() {
    struct Case { int raw_x, raw_y, screen_x, screen_y; };
    const Case corners[] = {
        {107, 959, 0, 0}, {107, 0, 959, 0},
        {372, 959, 0, 265}, {372, 0, 959, 265},
        {240, 480, 479, 133}
    };
    for (const auto& value : corners) {
        const auto point = pen::rawToScreen(value.raw_x, value.raw_y);
        require(point.has_value(), "visible touch must reach the screen");
        require(point->x == value.screen_x && point->y == value.screen_y,
                "raw touch must rotate into the physical visible band");
    }
    for (const auto& value : {pen::Point{106, 480}, pen::Point{373, 480},
                             pen::Point{240, -1}, pen::Point{240, 960}}) {
        require(!pen::rawToScreen(value.x, value.y), "off-screen touch must not clamp onto a button");
    }
    const auto nativeTop = pen::windowToScreen({0, 107}, 960, 480);
    require(nativeTop && nativeTop->x == 0 && nativeTop->y == 0, "Wayland letterbox starts at physical row 107");
    const auto nativeBottom = pen::windowToScreen({959, 372}, 960, 480);
    require(nativeBottom && nativeBottom->x == 959 && nativeBottom->y == 265, "Wayland visible bottom-right");
    require(!pen::windowToScreen({480, 106}, 960, 480), "hidden Wayland band must not activate top-row buttons");
    require(!pen::windowToScreen({480, 373}, 960, 480), "hidden Wayland band must not activate bottom-row buttons");
    const auto desktop = pen::windowToScreen({0, 0}, 960, 266);
    require(desktop && desktop->x == 0 && desktop->y == 0, "desktop test window has no hidden band");
    const auto retina = pen::windowToScreen({1918, 744}, 1920, 960);
    require(retina && retina->x == 959 && retina->y == 265, "scaled presentation keeps input aligned");
    require(!pen::windowToScreen({0, 0}, 0, 0), "minimized window is not interactive");
    const pen::Rect viewport{300, 0, 354, 266};
    const auto top = pen::screenToSource({300, 0}, viewport, {0, 0, 800, 600});
    require(top && top->x == 0 && top->y == 0, "source top-left mapping");
    const auto bottom = pen::screenToSource({653, 265}, viewport, {0, 0, 800, 600});
    require(bottom && bottom->x == 799 && bottom->y == 599, "source bottom-right mapping");
    require(!pen::screenToSource({654, 265}, viewport, {0, 0, 800, 600}), "right toolbar must not click the game");
    require(!pen::screenToSource({299, 0}, viewport, {0, 0, 800, 600}), "left toolbar must not click the game");
    require(!pen::screenToSource({300, 266}, viewport, {0, 0, 800, 600}), "bottom edge is outside the game");
    const auto crop = pen::screenToSource({100, 50}, {100, 50, 200, 100}, {80, 90, 400, 200});
    require(crop && crop->x == 80 && crop->y == 90, "zoomed region must retain its source origin");
    const auto cropEnd = pen::screenToSource({299, 149}, {100, 50, 200, 100}, {80, 90, 400, 200});
    require(cropEnd && cropEnd->x == 479 && cropEnd->y == 289, "zoomed region must map its last pixel");
    require(!pen::screenToSource({0, 0}, {0, 0, 0, 266}, {0, 0, 800, 600}), "empty viewport cannot divide by zero");
    for (int rawX = 107; rawX <= 372; ++rawX) {
        for (int rawY = 0; rawY <= 959; ++rawY) {
            const auto point = pen::rawToScreen(rawX, rawY);
            require(point && point->x >= 0 && point->x < 960 && point->y >= 0 && point->y < 266,
                    "every visible sensor position maps inside the framebuffer");
            require(point->x + rawY == 959 && point->y + 107 == rawX,
                    "physical rotation must be one-to-one without edge compression");
        }
    }
    std::printf("PASS: %d coordinate and boundary assertions\n", assertions);
}
