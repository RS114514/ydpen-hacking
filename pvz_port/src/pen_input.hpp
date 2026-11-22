#pragma once
#include <optional>

namespace pen {
struct Point { int x, y; };
struct Rect { int x, y, width, height; };
inline std::optional<Point> rawToScreen(int x, int y) {
    if (x < 107 || x > 372 || y < 0 || y > 959)
        return std::nullopt;
    return Point{959 - y, x - 107};
}
inline std::optional<Point> windowToScreen(Point point, int width, int height) {
    if (width <= 0 || height <= 0 || point.x < 0 || point.x >= width || point.y < 0 || point.y >= height)
        return std::nullopt;
    const int viewHeight = static_cast<int>(static_cast<long long>(height) * 960 / width);
    const int x = static_cast<int>(static_cast<long long>(point.x) * 960 / width);
    const int y = static_cast<int>(static_cast<long long>(point.y) * 960 / width) - (viewHeight - 266) / 2;
    if (y < 0 || y >= 266) return std::nullopt;
    return Point{x, y};
}
inline std::optional<Point> screenToSource(Point point, Rect viewport, Rect source) {
    if (viewport.width <= 1 || viewport.height <= 1 || source.width <= 0 || source.height <= 0)
        return std::nullopt;
    const int dx = point.x - viewport.x;
    const int dy = point.y - viewport.y;
    if (dx < 0 || dy < 0 || dx >= viewport.width || dy >= viewport.height)
        return std::nullopt;
    return Point{
        source.x + static_cast<int>(static_cast<long long>(dx) * (source.width - 1) / (viewport.width - 1)),
        source.y + static_cast<int>(static_cast<long long>(dy) * (source.height - 1) / (viewport.height - 1))
    };
}
}
