#pragma once
#include "pen_input.hpp"

namespace pen {
enum class ActionKind {
    None,
    Click,
    Cancel,
    Card,
    Menu,
    Shovel,
    ToggleAuto,
    Escape,
    Space,
    ReturnKey,
    Character,
    Backspace,
    Enter
};
struct Action { ActionKind kind = ActionKind::None; Point point{}; int value = 0; };

class View {
public:
    void press(Point);
    void move(Point);
    Action release(Point);
    void cancel();
    void setCardCount(int);
    void setBattle(bool value) { battle_ = value; }
    void showCards(bool value) { cards_ = value; }
    void showKeyboard(bool value) { keyboard_ = value; }
    bool pending() const { return pending_; }
    bool battle() const { return battle_; }
    bool keyboard() const { return keyboard_; }
    bool cards() const { return cards_; }
    Point cursor() const { return cursor_; }
    int cardPage() const { return cardPage_; }
    int keyboardPage() const { return keyboardPage_; }
    int cardCount() const { return cardCount_; }
    Rect sceneViewport() const;
    Rect sceneSource() const;
    Rect zoomSource() const;
    static Rect cardRect(int index);
    static Rect shortcutRect(int index);
    static Rect keyboardKeyRect(int index);
    static Rect keyboardControlRect(int index);

    static constexpr Rect sunBadge{8, 6, 100, 32};
    static constexpr Rect autoButton{114, 6, 72, 32};
    static constexpr Rect kbButton{192, 6, 56, 32};
    static constexpr Rect menuButton{8, 208, 57, 50};
    static constexpr Rect pauseButton{69, 208, 57, 50};
    static constexpr Rect shovelButton{130, 208, 57, 50};
    static constexpr Rect pageButton{191, 208, 57, 50};
    static constexpr Rect zoomViewport{630, 8, 322, 190};
    static constexpr Rect confirmButton{630, 206, 210, 52};
    static constexpr Rect cancelButton{848, 206, 104, 52};
private:
    int hit(Point) const;
    void aim(Point, Rect, Rect);
    Point cursor_{400, 300};
    float cursorFx_ = 400.0f;
    float cursorFy_ = 300.0f;
    Point lastZoomTouch_{};
    Point zoomStartTouch_{};
    Point sceneStartTouch_{};
    int zoomMaxDist_ = 0;
    int sceneMaxDist_ = 0;
    int pressed_ = -1;
    int cardCount_ = 0;
    int cardPage_ = 0;
    int keyboardPage_ = 0;
    bool pending_ = false;
    bool keyboard_ = false;
    bool cards_ = false;
    bool battle_ = false;
};
}
