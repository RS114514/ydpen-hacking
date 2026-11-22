#include "pen_view.hpp"
#include <cstdio>
#include <cstdlib>

static int checks;
static void check(bool value, const char* reason) {
    ++checks;
    if (!value) { std::fprintf(stderr, "FAIL: %s\n", reason); std::exit(1); }
}
static pen::Action tap(pen::View& view, pen::Point point) {
    view.press(point);
    return view.release(point);
}
int main() {
    pen::View view;
    // Non-battle direct touch on canvas clicks immediately
    view.setBattle(false);
    const auto menuTap = tap(view, {439, 133});
    check(menuTap.kind == pen::ActionKind::Click, "non-battle canvas tap clicks directly");

    // Non-battle drag > slop aims without clicking
    view.press({320, 80});
    view.move({400, 140});
    check(view.release({400, 140}).kind == pen::ActionKind::None, "non-battle canvas drag aims without clicking");

    // Battle mode: canvas tap only previews, never clicks directly
    view.setBattle(true);
    check(view.sceneSource().x == 0 && view.sceneSource().y == 0 &&
          view.sceneSource().width == 800 && view.sceneSource().height == 600,
          "battle sceneSource must be full uncropped 800x600");
    check(tap(view, {439, 133}).kind == pen::ActionKind::None, "battle canvas tap previews without spending sun");
    check(view.pending(), "battle canvas tap leaves visible pending target");
    const auto target = view.cursor();

    // OK confirms and allows consecutive left-clicks without re-aiming
    const auto commit1 = tap(view, {735, 232});
    check(commit1.kind == pen::ActionKind::Click, "first OK emits click");
    check(commit1.point.x == target.x && commit1.point.y == target.y, "OK uses target");
    const auto commit2 = tap(view, {735, 232});
    check(commit2.kind == pen::ActionKind::Click, "consecutive OK click works without re-touching screen");
    check(commit2.point.x == target.x && commit2.point.y == target.y, "consecutive OK reuses cursor");

    // Cancel emits right-click cancel and clears pending
    tap(view, {439, 133});
    check(tap(view, {900, 232}).kind == pen::ActionKind::Cancel, "cancel emits right-click cancel");
    check(!view.pending(), "cancel clears pending target");

    // Sliding off OK must not click
    tap(view, {439, 133});
    view.press({735, 232});
    check(view.release({600, 232}).kind == pen::ActionKind::None, "sliding off OK must not plant");
    check(view.pending(), "sliding off OK preserves preview");

    // Touchpad drag moves cursor at tuned 1.2/1.5 gain and never clicks on release
    const auto beforePad = view.cursor();
    view.press({700, 60});
    view.move({760, 90});
    const auto afterPad = view.cursor();
    check(afterPad.x - beforePad.x == 90 && afterPad.y - beforePad.y == 45,
          "touchpad drag uses 1.5x fast gain cleanly");
    check(afterPad.x >= 0 && afterPad.x < 800 && afterPad.y >= 0 && afterPad.y < 600, "touchpad stays in bounds");
    check(view.release({760, 90}).kind == pen::ActionKind::None, "touchpad drag release never clicks");
    check(view.pending(), "touchpad drag leaves pending aim");

    // Touchpad single-tap without dragging acts as left-click at current cursor
    const auto padTap = tap(view, {780, 100});
    check(padTap.kind == pen::ActionKind::Click, "single tap on touchpad emits left-click");
    check(padTap.point.x == afterPad.x && padTap.point.y == afterPad.y, "touchpad tap clicks at cursor");

    // Focus loss clears preview
    tap(view, {439, 133});
    view.cancel();
    check(!view.pending(), "focus loss clears preview");

    // Top bar & 4-button bottom bar controls
    check(tap(view, {150, 22}).kind == pen::ActionKind::ToggleAuto, "top AUTO toggles auto collect");
    check(tap(view, {36, 233}).kind == pen::ActionKind::Menu, "bottom MENU emits Menu");
    check(tap(view, {97, 233}).kind == pen::ActionKind::Space, "bottom PAUSE emits Space");
    check(tap(view, {158, 233}).kind == pen::ActionKind::Shovel, "bottom SHOVEL emits Shovel");
    tap(view, {220, 22});
    check(view.keyboard(), "top KB opens keyboard");
    tap(view, {96, 230});
    check(!view.keyboard(), "keyboard close hides keyboard");

    // Non-battle shortcuts (ENTER instead of SPACE)
    view.setBattle(false);
    view.showCards(false);
    check(tap(view, {190, 82}).kind == pen::ActionKind::ReturnKey, "non-battle tile 1 emits ReturnKey");

    // 6-card grid + paging
    view.setBattle(true);
    view.setCardCount(10);
    view.showCards(true);
    check(tap(view, {46, 82}).kind == pen::ActionKind::Card, "card slot 0 selects card 0");
    tap(view, {219, 233}); // PAGE button
    auto card = tap(view, {46, 82});
    check(card.kind == pen::ActionKind::Card && card.value == 6, "second card page starts at slot 6");
    card = tap(view, {210, 164});
    check(card.kind == pen::ActionKind::None, "empty final-page cells cannot select another seed");
    view.setCardCount(1);
    card = tap(view, {46, 82});
    check(card.kind == pen::ActionKind::Card && card.value == 0, "conveyor shrink clamps card page");

    // Virtual keyboard input
    view.showKeyboard(true);
    const auto letter = tap(view, {78, 54});
    check(letter.kind == pen::ActionKind::Character && letter.value == 'A', "keyboard delivers real character input");
    check(view.keyboard(), "typing keeps keyboard open");
    const auto enter = tap(view, {866, 230});
    check(enter.kind == pen::ActionKind::Enter && !view.keyboard(), "enter submits name and closes keyboard");

    std::printf("PASS: %d preview, direct-menu, touchpad-click, pause and keyboard assertions\n", checks);
}
