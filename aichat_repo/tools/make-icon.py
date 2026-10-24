#!/usr/bin/env python3
"""生成 app_icon.png（256x256 透明底）。

笔端桌面直接读这个 PNG（package.json 的 icon 字段，构建时拷进包根），
不做尺寸校验也不缩放，因此这里固定输出 256x256 以适配高分屏桌面。
图案：深色圆角方块 + 蓝色对话气泡 + 白色「AI」。

只用标准库（zlib + struct）手写 PNG，不依赖 Pillow。
"""
import struct
import zlib
from pathlib import Path

SIZE = 256
BG = (14, 17, 22, 255)          # #0e1116 与 App 主题一致
BUBBLE = (62, 166, 255, 255)    # #3ea6ff 主强调色
BUBBLE_DARK = (29, 74, 112, 255)
TEXT = (255, 255, 255, 255)
TAIL = (62, 166, 255, 255)

# 5x7 点阵字模（只做 A / I 两个字母，够用且无需字体文件）
GLYPHS = {
    "A": [
        "00100",
        "01010",
        "10001",
        "11111",
        "10001",
        "10001",
        "10001",
    ],
    "I": [
        "11111",
        "00100",
        "00100",
        "00100",
        "00100",
        "00100",
        "11111",
    ],
}


def rounded_rect_mask(x, y, x0, y0, x1, y1, r):
    """点 (x,y) 是否落在圆角矩形内。"""
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    dx = x - cx
    dy = y - cy
    return dx * dx + dy * dy <= r * r


def main():
    px = [[(0, 0, 0, 0) for _ in range(SIZE)] for _ in range(SIZE)]

    # 底板：整块圆角方
    for y in range(SIZE):
        for x in range(SIZE):
            if rounded_rect_mask(x, y, 8, 8, SIZE - 9, SIZE - 9, 56):
                px[y][x] = BG

    # 对话气泡主体
    bx0, by0, bx1, by1 = 38, 52, 218, 176
    for y in range(by0, by1 + 1):
        for x in range(bx0, bx1 + 1):
            if rounded_rect_mask(x, y, bx0, by0, bx1, by1, 28):
                px[y][x] = BUBBLE

    # 气泡内下方留白带（做出「气泡里嵌深色条」的层次）
    for y in range(140, 163):
        for x in range(58, 198):
            if rounded_rect_mask(x, y, 58, 140, 198, 163, 11):
                px[y][x] = BUBBLE_DARK

    # 气泡尾巴（右下三角）
    for i in range(34):
        for x in range(150 + i, 190):
            y = 176 + i
            if 0 <= y < SIZE:
                px[y][x] = BUBBLE

    # 文字 "AI"：每格 9px，垂直居中于气泡上半区（气泡 52..176，深色条 140..163）
    cell = 9
    text = "AI"
    gap = 12
    total_w = len(text) * 5 * cell + (len(text) - 1) * gap
    start_x = (SIZE - total_w) // 2
    start_y = (52 + 140) // 2 - (7 * cell) // 2
    for gi, ch in enumerate(text):
        glyph = GLYPHS[ch]
        ox = start_x + gi * (5 * cell + gap)
        for ry, row in enumerate(glyph):
            for rx, bit in enumerate(row):
                if bit != "1":
                    continue
                for dy in range(cell):
                    for dx in range(cell):
                        x = ox + rx * cell + dx
                        y = start_y + ry * cell + dy
                        if 0 <= x < SIZE and 0 <= y < SIZE:
                            px[y][x] = TEXT

    raw = bytearray()
    for y in range(SIZE):
        raw.append(0)  # filter type 0
        for x in range(SIZE):
            raw.extend(px[y][x])

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        return out + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)  # 8bit RGBA
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )

    out_path = Path(__file__).resolve().parent.parent / "app_icon.png"
    out_path.write_bytes(png)

    # 自证：统计非透明像素，避免又生成一张全透明图
    opaque = sum(1 for y in range(SIZE) for x in range(SIZE) if px[y][x][3] > 0)
    print("wrote %s (%d bytes)" % (out_path, len(png)))
    print("size=%dx%d opaque=%.1f%%" % (SIZE, SIZE, 100.0 * opaque / (SIZE * SIZE)))


if __name__ == "__main__":
    main()
