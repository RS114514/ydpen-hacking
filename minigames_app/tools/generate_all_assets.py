#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""generate_all_assets.py —— 为《小游戏全集》生成全套 16 款游戏及大厅的 16-bit 像素艺术高清素材
零外部依赖，使用纯 Python 标准库 (struct, zlib) 输出高品质 RGBA PNG 贴图。
"""
import os
import zlib
import struct
import math

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

def encode_png(width, height, rgba_data):
    """纯 Python 生成标准 32-bit RGBA PNG 字节流"""
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # Filter: None
        raw.extend(rgba_data[y * width * 4 : (y + 1) * width * 4])
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b'')

class PixelCanvas:
    def __init__(self, width, height, bg=(0, 0, 0, 0)):
        self.w = width
        self.h = height
        self.buf = bytearray(width * height * 4)
        if bg[3] > 0:
            for i in range(width * height):
                self.buf[i*4 : i*4+4] = bg

    def set(self, x, y, col):
        if 0 <= x < self.w and 0 <= y < self.h:
            idx = (y * self.w + x) * 4
            self.buf[idx : idx+4] = col

    def fill_rect(self, x, y, w, h, col):
        for cy in range(max(0, y), min(self.h, y + h)):
            for cx in range(max(0, x), min(self.w, x + w)):
                self.set(cx, cy, col)

    def stroke_rect(self, x, y, w, h, col):
        for cx in range(x, x + w):
            self.set(cx, y, col)
            self.set(cx, y + h - 1, col)
        for cy in range(y, y + h):
            self.set(x, cy, col)
            self.set(x + w - 1, cy, col)

    def draw_beveled_box(self, x, y, w, h, base, light, dark, border=None):
        self.fill_rect(x, y, w, h, base)
        for cx in range(x, x + w - 1):
            self.set(cx, y, light)
            self.set(cx, y + 1, light)
        for cy in range(y, y + h - 1):
            self.set(x, cy, light)
            self.set(x + 1, cy, light)
        for cx in range(x + 1, x + w):
            self.set(cx, y + h - 1, dark)
            self.set(cx, y + h - 2, dark)
        for cy in range(y + 1, y + h):
            self.set(x + w - 1, cy, dark)
            self.set(x + w - 2, cy, dark)
        if border:
            self.stroke_rect(x, y, w, h, border)

    def draw_circle(self, cx, cy, r, fill, border=None):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                d2 = (x - cx)**2 + (y - cy)**2
                if d2 <= r**2:
                    if border and d2 >= (r - 1.8)**2:
                        self.set(x, y, border)
                    else:
                        self.set(x, y, fill)

    def draw_matrix(self, x0, y0, matrix, palette, scale=1):
        for row_idx, row in enumerate(matrix):
            for col_idx, char in enumerate(row):
                if char in palette:
                    col = palette[char]
                    if col and col[3] > 0:
                        for sy in range(scale):
                            for sx in range(scale):
                                self.set(x0 + col_idx * scale + sx, y0 + row_idx * scale + sy, col)

    def save(self, filename):
        path = os.path.join(ASSETS_DIR, filename)
        with open(path, "wb") as f:
            f.write(encode_png(self.w, self.h, self.buf))

# ============================================================================
# 1. 超级马里奥 (Mario)
# ============================================================================
MARIO_PALETTE = {
    '.': (0, 0, 0, 0),
    'R': (220, 38, 38, 255),    # 红帽子/红上衣
    'B': (37, 99, 235, 255),    # 蓝色背带裤
    'S': (254, 215, 170, 255),  # 皮肤肉色
    'D': (120, 53, 15, 255),    # 棕色头发/胡子/靴子
    'Y': (250, 204, 21, 255),   # 金色背带扣
    'K': (15, 23, 42, 255)      # 黑色眼睛
}

MARIO_IDLE = [
    "....RRRRR.......",
    "...RRRRRRRRR....",
    "...DDDSSD.......",
    "..DSDSSSD.......",
    "..DSDSSSSD......",
    "..DDSSSSDD......",
    "....SSSSSSS.....",
    "...RRBRRR.......",
    "..RRRBRRRRR.....",
    ".RRRRBBBRRRR....",
    ".SS.BYB.SS......",
    "...BBBBBBB......",
    "...BBBBBBB......",
    "..BBB...BBB.....",
    "..DDD...DDD.....",
    ".DDDD...DDDD...."
]

MARIO_RUN = [
    "....RRRRR.......",
    "...RRRRRRRRR....",
    "...DDDSSD.......",
    "..DSDSSSD.......",
    "..DSDSSSSD......",
    "..DDSSSSDD......",
    "....SSSSSSS.....",
    "...RRBRRR.......",
    "..RRRBRRRRR.....",
    ".RRRRBBBRRRR....",
    "...SSBYB.SS.....",
    "..BBBBBBB.......",
    ".BBBBBBBBB......",
    ".DDD..BBBBB.....",
    "DDDD...DDDD.....",
    "........DDD....."
]

MARIO_JUMP = [
    "........RRRRR...",
    ".......RRRRRRRRR",
    ".......DDDSSD...",
    "......DSDSSSD...",
    "......DSDSSSSD..",
    "......DDSSSSDD..",
    "........SSSSSSS.",
    "...SS..RRBRRR...",
    "..SSS.RRRBRRR...",
    "..SS.RRRRBBBR...",
    ".....SS.BYB.SS..",
    ".......BBBBBBB..",
    "......BBBBBBBB..",
    ".....DDDD..BB...",
    "....DDDDD...DDD.",
    ".............DD."
]

def make_mario_sprites():
    # 站立、跑动、起跳帧 (32x32)
    for name, m in [("mario_idle.png", MARIO_IDLE), ("mario_run.png", MARIO_RUN), ("mario_jump.png", MARIO_JUMP)]:
        c = PixelCanvas(32, 32)
        c.draw_matrix(0, 0, m, MARIO_PALETTE, scale=2)
        c.save(name)

    # 砖块 (32x32)
    c = PixelCanvas(32, 32)
    c.draw_beveled_box(0, 0, 32, 32, (180, 83, 9, 255), (217, 119, 6, 255), (120, 53, 15, 255), (69, 26, 3, 255))
    # 砂浆刻痕
    c.fill_rect(0, 15, 32, 2, (69, 26, 3, 255))
    c.fill_rect(15, 0, 2, 15, (69, 26, 3, 255))
    c.fill_rect(7, 17, 2, 15, (69, 26, 3, 255))
    c.fill_rect(23, 17, 2, 15, (69, 26, 3, 255))
    c.save("mario_block_brick.png")

    # 问号箱 (32x32)
    c = PixelCanvas(32, 32)
    c.draw_beveled_box(0, 0, 32, 32, (234, 179, 8, 255), (253, 224, 71, 255), (161, 98, 7, 255), (113, 63, 18, 255))
    # 问号图案
    q_mat = [
        "....YYYY....",
        "...YY..YY...",
        "......YY....",
        ".....YY.....",
        ".....YY.....",
        "............",
        ".....YY....."
    ]
    c.draw_matrix(4, 7, q_mat, {'Y': (255, 255, 255, 255), '.': (0,0,0,0)}, scale=2)
    # 四角螺栓
    for bx, by in [(3, 3), (27, 3), (3, 27), (27, 27)]:
        c.set(bx, by, (113, 63, 18, 255))
    c.save("mario_block_coin.png")

    # 空问号箱 (32x32)
    c = PixelCanvas(32, 32)
    c.draw_beveled_box(0, 0, 32, 32, (100, 116, 139, 255), (148, 163, 184, 255), (51, 65, 85, 255), (15, 23, 42, 255))
    for bx, by in [(3, 3), (27, 3), (3, 27), (27, 27)]:
        c.set(bx, by, (15, 23, 42, 255))
    c.save("mario_block_empty.png")

    # 绿色水管帽沿 (48x24)
    c = PixelCanvas(48, 24)
    c.draw_beveled_box(0, 0, 48, 24, (22, 163, 74, 255), (74, 222, 128, 255), (21, 128, 61, 255), (5, 46, 22, 255))
    # 水管高光条
    c.fill_rect(6, 3, 6, 18, (134, 239, 172, 255))
    c.fill_rect(12, 3, 4, 18, (74, 222, 128, 255))
    c.save("mario_pipe_top.png")

    # 绿色水管管身 (48x32)
    c = PixelCanvas(48, 32)
    c.draw_beveled_box(4, 0, 40, 32, (22, 163, 74, 255), (74, 222, 128, 255), (21, 128, 61, 255), (5, 46, 22, 255))
    c.fill_rect(8, 0, 6, 32, (134, 239, 172, 255))
    c.fill_rect(14, 0, 4, 32, (74, 222, 128, 255))
    c.save("mario_pipe_body.png")

    # 板栗仔小怪 (28x28)
    c = PixelCanvas(28, 28)
    goomba = [
        ".....DDDDDD.....",
        "...DDDDDDDDDD...",
        "..DDDDDDDDDDDD..",
        ".DDDDDDDDDDDDDD.",
        ".DDDDDDDDDDDDDD.",
        ".DD.KDDDDDD.KDD.",
        ".DD.KDDDDDD.KDD.",
        ".DDKKDDDDDD.KKD.",
        "..SSSSSSSSSSSS..",
        "...SSSSSSSSSS...",
        "..KKKSSSSSSKKK..",
        ".KKKKK....KKKKK.",
        ".KKKK......KKKK.",
        "..KK........KK.."
    ]
    c.draw_matrix(0, 0, goomba, {
        '.': (0,0,0,0),
        'D': (146, 64, 14, 255),   # 棕色伞盖
        'K': (15, 23, 42, 255),    # 黑色眼睛与脚
        'S': (254, 215, 170, 255)  # 身体肉色
    }, scale=2)
    c.save("mario_goomba.png")

    # 终点红旗 (32x48)
    c = PixelCanvas(32, 48)
    # 旗杆
    c.fill_rect(6, 4, 4, 44, (203, 213, 225, 255))
    c.fill_rect(4, 0, 8, 4, (234, 179, 8, 255))  # 金色杆头圆球
    # 三角红旗
    for y in range(4, 24):
        w = int(22 * (1.0 - (y - 4) / 20.0))
        c.fill_rect(10, y, max(1, w), 1, (239, 68, 68, 255))
    c.save("mario_flag.png")

# ============================================================================
# 2. 谷歌小恐龙 (Chrome Dino)
# ============================================================================
DINO_PALETTE = {
    '.': (0,0,0,0),
    'G': (16, 185, 129, 255),  # 翡翠绿经典恐龙
    'W': (255, 255, 255, 255), # 眼睛白色
    'K': (9, 13, 22, 255)      # 眼睛瞳孔
}

DINO_RUN1 = [
    "..........GGGGGGGG",
    ".........GGGGGGGGG",
    ".........GGWGGGGGG",
    ".........GGKGGGGGG",
    ".........GGGGGGGGG",
    ".........GGGG.....",
    ".........GGGGGGGG.",
    "G.......GGGG......",
    "GG.....GGGGGGGG...",
    "GGG...GGGGGGGGG...",
    "GGGG.GGGGGGGGGG...",
    ".GGGGGGGGGGGGGG...",
    "..GGGGGGGGGGGGG...",
    "...GGGGGGGGGGGG...",
    "....GGGGGGGG......",
    ".....GG....GG.....",
    ".....GG.....GG....",
    ".....GGG....GG....",
    ".....GG..........."]

DINO_RUN2 = [
    "..........GGGGGGGG",
    ".........GGGGGGGGG",
    ".........GGWGGGGGG",
    ".........GGKGGGGGG",
    ".........GGGGGGGGG",
    ".........GGGG.....",
    ".........GGGGGGGG.",
    "G.......GGGG......",
    "GG.....GGGGGGGG...",
    "GGG...GGGGGGGGG...",
    "GGGG.GGGGGGGGGG...",
    ".GGGGGGGGGGGGGG...",
    "..GGGGGGGGGGGGG...",
    "...GGGGGGGGGGGG...",
    "....GGGGGGGG......",
    ".....GG....GG.....",
    "....GG......GG....",
    "............GGG...",
    "............GG...."]

def make_dino_sprites():
    # 恐龙跑动帧 1 & 2 (36x40)
    c1 = PixelCanvas(36, 40)
    c1.draw_matrix(0, 0, DINO_RUN1, DINO_PALETTE, scale=2)
    c1.save("dino_run1.png")

    c2 = PixelCanvas(36, 40)
    c2.draw_matrix(0, 0, DINO_RUN2, DINO_PALETTE, scale=2)
    c2.save("dino_run2.png")

    # 仙人掌障碍 (24x40)
    c = PixelCanvas(24, 40)
    cac = [
        "....GG....",
        "....GG....",
        ".GG.GG....",
        ".GG.GG.GG.",
        ".GG.GG.GG.",
        ".GGGGG.GG.",
        "..GGGGGGG.",
        "....GG....",
        "....GG....",
        "....GG...."
    ]
    c.draw_matrix(2, 0, cac, {'.': (0,0,0,0), 'G': (5, 150, 105, 255)}, scale=2)
    c.save("dino_cactus.png")

    # 翼龙 (36x24)
    c = PixelCanvas(36, 24)
    ptero = [
        "....KK............",
        "...KKKK...........",
        "..KKKKKK..........",
        ".KKKKKKKK.........",
        "..KKKKKKKKKKKK....",
        "...KKKKKKKKKKKKKKK",
        "....KKKKKKKKKKKKKK",
        ".....KKK...KKKK...",
        "......KK.........."
    ]
    c.draw_matrix(0, 2, ptero, {'.': (0,0,0,0), 'K': (13, 148, 136, 255)}, scale=2)
    c.save("dino_pterodactyl.png")

# ============================================================================
# 3. 像素飞鸟 (Flappy Bird)
# ============================================================================
BIRD_PAL = {
    '.': (0,0,0,0),
    'Y': (250, 204, 21, 255),  # 黄色羽毛
    'O': (249, 115, 22, 255),  # 橘红大嘴
    'W': (255, 255, 255, 255), # 大眼睛白
    'K': (15, 23, 42, 255),    # 黑色轮廓/眼珠
    'B': (254, 240, 138, 255)  # 腹部浅黄
}

BIRD_FRAME1 = [
    "....KKKKKK......",
    "..KYYYYYYYKK....",
    ".KYYYYYYYYYYK...",
    "KYYYYWWKYYYYYK..",
    "KYYYYWWKYYYYYK..",
    "KYYBBYYKYYYYYK..",
    "KYYBBBBYOOOOOOK.",
    ".KYBBBBKOOOOOOK.",
    "..KKKKKKKKKKKK.."
]

BIRD_FRAME2 = [
    "....KKKKKK......",
    "..KYYYYYYYKK....",
    ".KYYYYYYYYYYK...",
    "KYYYYWWKYYYYYK..",
    "KYYYYWWKYYYYYK..",
    "KYYBBBYKYYYYYK..",
    "KYYYYYBYOOOOOOK.",
    ".KYYYYBKOOOOOOK.",
    "..KKKKKKKKKKKK.."
]

def make_flappy_sprites():
    c1 = PixelCanvas(34, 24)
    c1.draw_matrix(1, 2, BIRD_FRAME1, BIRD_PAL, scale=2)
    c1.save("flappy_bird1.png")

    c2 = PixelCanvas(34, 24)
    c2.draw_matrix(1, 2, BIRD_FRAME2, BIRD_PAL, scale=2)
    c2.save("flappy_bird2.png")

    # 飞鸟水管口 (54x26)
    c = PixelCanvas(54, 26)
    c.draw_beveled_box(0, 0, 54, 26, (34, 197, 94, 255), (134, 239, 172, 255), (21, 128, 61, 255), (5, 46, 22, 255))
    c.fill_rect(8, 3, 6, 20, (187, 247, 208, 255))
    c.save("flappy_pipe_rim.png")

    # 飞鸟水管身 (48x32)
    c = PixelCanvas(48, 32)
    c.draw_beveled_box(3, 0, 42, 32, (34, 197, 94, 255), (134, 239, 172, 255), (21, 128, 61, 255), (5, 46, 22, 255))
    c.fill_rect(8, 0, 6, 32, (187, 247, 208, 255))
    c.save("flappy_pipe_stem.png")

# ============================================================================
# 4. 经典扫雷 (Minesweeper)
# ============================================================================
def make_minesweeper_sprites():
    # 凸起未翻开格子 (24x24)
    c = PixelCanvas(24, 24)
    c.draw_beveled_box(0, 0, 24, 24, (148, 163, 184, 255), (241, 245, 249, 255), (71, 85, 105, 255), (51, 65, 85, 255))
    c.save("mine_tile_up.png")

    # 凹陷翻开格子 (24x24)
    c = PixelCanvas(24, 24)
    c.fill_rect(0, 0, 24, 24, (203, 213, 225, 255))
    c.stroke_rect(0, 0, 24, 24, (148, 163, 184, 255))
    c.save("mine_tile_down.png")

    # 地雷炸弹 (24x24)
    c = PixelCanvas(24, 24)
    c.fill_rect(0, 0, 24, 24, (203, 213, 225, 255))
    c.stroke_rect(0, 0, 24, 24, (148, 163, 184, 255))
    # 黑色带刺圆雷
    c.draw_circle(12, 12, 7, (15, 23, 42, 255))
    # 刺尖
    for dx, dy in [(0, -9), (0, 9), (-9, 0), (9, 0), (-6, -6), (6, -6), (-6, 6), (6, 6)]:
        c.fill_rect(12 + dx, 12 + dy, 2, 2, (15, 23, 42, 255))
    # 高光小白点
    c.set(10, 10, (255, 255, 255, 255))
    c.set(11, 10, (255, 255, 255, 255))
    c.save("mine_bomb.png")

    # 红色三角旗 (24x24)
    c = PixelCanvas(24, 24)
    c.draw_beveled_box(0, 0, 24, 24, (148, 163, 184, 255), (241, 245, 249, 255), (71, 85, 105, 255), (51, 65, 85, 255))
    # 旗杆与底座
    c.fill_rect(13, 5, 2, 13, (15, 23, 42, 255))
    c.fill_rect(9, 18, 9, 2, (15, 23, 42, 255))
    # 红旗
    for y in range(5, 13):
        w = int(8 * (1.0 - (y - 5) / 8.0))
        c.fill_rect(13 - w, y, max(1, w), 1, (220, 38, 38, 255))
    c.save("mine_flag.png")

# ============================================================================
# 5. 经典贪吃蛇 (Snake)
# ============================================================================
def make_snake_sprites():
    # 蛇头 (20x20)
    c = PixelCanvas(20, 20)
    c.draw_circle(10, 10, 8, (34, 197, 94, 255), (21, 128, 61, 255))
    # 双眼
    c.draw_circle(7, 7, 2, (255, 255, 255, 255), (15, 23, 42, 255))
    c.draw_circle(13, 7, 2, (255, 255, 255, 255), (15, 23, 42, 255))
    c.set(7, 7, (15, 23, 42, 255))
    c.set(13, 7, (15, 23, 42, 255))
    c.save("snake_head.png")

    # 蛇身鳞片节 (20x20)
    c = PixelCanvas(20, 20)
    c.draw_circle(10, 10, 7, (74, 222, 128, 255), (34, 197, 94, 255))
    c.fill_rect(7, 7, 6, 6, (134, 239, 172, 255))
    c.save("snake_body.png")

    # 红苹果 (20x20)
    c = PixelCanvas(20, 20)
    c.draw_circle(10, 11, 7, (239, 68, 68, 255), (185, 28, 28, 255))
    # 果柄与绿叶
    c.fill_rect(9, 2, 2, 3, (120, 53, 15, 255))
    c.fill_rect(11, 3, 3, 2, (34, 197, 94, 255))
    # 果面高光
    c.set(7, 8, (254, 202, 202, 255))
    c.save("snake_apple.png")

# ============================================================================
# 6. 黄金矿工 (Gold Miner)
# ============================================================================
def make_miner_sprites():
    # 矿工人物 (40x40)
    c = PixelCanvas(40, 40)
    # 黄色安全帽
    c.draw_beveled_box(12, 4, 16, 8, (234, 179, 8, 255), (253, 224, 71, 255), (161, 98, 7, 255))
    # 脸与白胡子
    c.fill_rect(14, 12, 12, 12, (254, 215, 170, 255))
    c.fill_rect(12, 18, 16, 8, (241, 245, 249, 255)) # 大白胡子
    c.set(17, 15, (15, 23, 42, 255))
    c.set(23, 15, (15, 23, 42, 255))
    # 蓝色工装
    c.fill_rect(10, 26, 20, 14, (30, 64, 175, 255))
    c.save("miner_char.png")

    # 飞爪 (24x24)
    c = PixelCanvas(24, 24)
    c.fill_rect(10, 0, 4, 8, (148, 163, 184, 255))
    # 两个张开的钢爪
    c.fill_rect(4, 8, 4, 12, (203, 213, 225, 255))
    c.fill_rect(16, 8, 4, 12, (203, 213, 225, 255))
    c.fill_rect(8, 18, 8, 3, (100, 116, 139, 255))
    c.save("miner_claw.png")

    # 大/中/小金块
    for name, sz in [("miner_gold_s.png", 18), ("miner_gold_m.png", 28), ("miner_gold_l.png", 38)]:
        c = PixelCanvas(sz, sz)
        c.draw_beveled_box(0, 0, sz, sz, (245, 158, 11, 255), (253, 224, 71, 255), (180, 83, 9, 255), (120, 53, 15, 255))
        c.fill_rect(3, 3, sz//3, sz//3, (254, 240, 138, 255))
        c.save(name)

    # 钻石 (24x24)
    c = PixelCanvas(24, 24)
    c.draw_circle(12, 12, 9, (6, 182, 212, 255), (8, 145, 178, 255))
    c.fill_rect(8, 8, 8, 8, (165, 243, 252, 255))
    c.save("miner_diamond.png")

    # 大岩石 (32x32)
    c = PixelCanvas(32, 32)
    c.draw_beveled_box(0, 0, 32, 32, (100, 116, 139, 255), (148, 163, 184, 255), (51, 65, 85, 255), (30, 41, 59, 255))
    c.save("miner_rock.png")

# ============================================================================
# 7. 合成大西瓜 (Watermelon) —— 10 阶水果
# ============================================================================
FRUITS = [
    ("fruit_1_grape.png", 24, (168, 85, 247, 255), (126, 34, 206, 255), "葡"),
    ("fruit_2_cherry.png", 28, (239, 68, 68, 255), (185, 28, 28, 255), "樱"),
    ("fruit_3_orange.png", 34, (249, 115, 22, 255), (194, 65, 12, 255), "橘"),
    ("fruit_4_lemon.png", 40, (234, 179, 8, 255), (161, 98, 7, 255), "柠"),
    ("fruit_5_kiwi.png", 46, (132, 204, 22, 255), (77, 124, 15, 255), "猕"),
    ("fruit_6_tomato.png", 52, (225, 29, 72, 255), (159, 18, 57, 255), "茄"),
    ("fruit_7_peach.png", 60, (244, 114, 182, 255), (190, 24, 93, 255), "桃"),
    ("fruit_8_pineapple.png", 68, (245, 158, 11, 255), (180, 83, 9, 255), "菠"),
    ("fruit_9_coconut.png", 78, (161, 98, 7, 255), (113, 63, 18, 255), "椰"),
    ("fruit_10_watermelon.png", 88, (34, 197, 94, 255), (21, 128, 61, 255), "瓜")
]

def make_watermelon_sprites():
    for name, size, fill, border, label in FRUITS:
        c = PixelCanvas(size, size)
        r = size // 2 - 1
        c.draw_circle(size // 2, size // 2, r, fill, border)
        # 高光亮弧
        c.fill_rect(size // 3, size // 4, size // 3, max(2, size // 8), (255, 255, 255, 180))
        # 绿色条纹 (仅西瓜)
        if "watermelon" in name:
            for sx in range(12, size - 12, 14):
                c.fill_rect(sx, 8, 4, size - 16, (20, 83, 45, 255))
        c.save(name)

# ============================================================================
# 8. 俄罗斯方块 (Tetris) —— 7 款 3D 立体晶块
# ============================================================================
TETRIS_COLORS = [
    ("tetris_cyan.png", (6, 182, 212, 255), (103, 232, 249, 255), (14, 116, 144, 255)),
    ("tetris_yellow.png", (234, 179, 8, 255), (253, 224, 71, 255), (161, 98, 7, 255)),
    ("tetris_purple.png", (168, 85, 247, 255), (216, 180, 254, 255), (126, 34, 206, 255)),
    ("tetris_green.png", (34, 197, 94, 255), (134, 239, 172, 255), (21, 128, 61, 255)),
    ("tetris_red.png", (239, 68, 68, 255), (252, 165, 165, 255), (185, 28, 28, 255)),
    ("tetris_blue.png", (59, 130, 246, 255), (147, 197, 253, 255), (29, 78, 216, 255)),
    ("tetris_orange.png", (249, 115, 22, 255), (253, 186, 116, 255), (194, 65, 12, 255))
]

def make_tetris_sprites():
    for name, base, light, dark in TETRIS_COLORS:
        c = PixelCanvas(20, 20)
        c.draw_beveled_box(0, 0, 20, 20, base, light, dark, (15, 23, 42, 255))
        c.set(3, 3, (255, 255, 255, 220))
        c.set(4, 3, (255, 255, 255, 220))
        c.save(name)

# ============================================================================
# 9. 趣味消消乐 (Match 3) —— 6 款光彩宝石
# ============================================================================
GEMS = [
    ("gem_ruby.png", (225, 29, 72, 255), (251, 113, 133, 255), (159, 18, 57, 255)),
    ("gem_sapphire.png", (37, 99, 235, 255), (96, 165, 250, 255), (30, 64, 175, 255)),
    ("gem_emerald.png", (16, 185, 129, 255), (52, 211, 153, 255), (4, 120, 87, 255)),
    ("gem_topaz.png", (245, 158, 11, 255), (251, 191, 36, 255), (180, 83, 9, 255)),
    ("gem_amethyst.png", (147, 51, 234, 255), (192, 132, 252, 255), (107, 33, 168, 255)),
    ("gem_diamond.png", (6, 182, 212, 255), (207, 250, 254, 255), (14, 116, 144, 255))
]

def make_match3_sprites():
    for name, base, light, dark in GEMS:
        c = PixelCanvas(28, 28)
        c.draw_beveled_box(2, 2, 24, 24, base, light, dark, (15, 23, 42, 255))
        # 宝石切割折线面
        c.stroke_rect(6, 6, 16, 16, light)
        c.set(8, 8, (255, 255, 255, 255))
        c.set(9, 8, (255, 255, 255, 255))
        c.save(name)

# ============================================================================
# 10. 经典推箱子 (Sokoban)
# ============================================================================
def make_sokoban_sprites():
    # 货箱 (24x24)
    c = PixelCanvas(24, 24)
    c.draw_beveled_box(0, 0, 24, 24, (180, 83, 9, 255), (245, 158, 11, 255), (120, 53, 15, 255), (69, 26, 3, 255))
    # 木箱十字加固带
    c.fill_rect(10, 0, 4, 24, (120, 53, 15, 255))
    c.fill_rect(0, 10, 24, 4, (120, 53, 15, 255))
    c.save("soko_crate.png")

    # 归位发光货箱 (24x24)
    c = PixelCanvas(24, 24)
    c.draw_beveled_box(0, 0, 24, 24, (234, 179, 8, 255), (253, 224, 71, 255), (161, 98, 7, 255), (113, 63, 18, 255))
    c.fill_rect(10, 0, 4, 24, (202, 138, 4, 255))
    c.fill_rect(0, 10, 24, 4, (202, 138, 4, 255))
    # 绿色小勾 / 星
    c.set(11, 11, (34, 197, 94, 255))
    c.set(12, 11, (34, 197, 94, 255))
    c.save("soko_crate_goal.png")

    # 目标圆点 (24x24)
    c = PixelCanvas(24, 24)
    c.fill_rect(0, 0, 24, 24, (15, 23, 42, 255))
    c.draw_circle(12, 12, 5, (16, 185, 129, 255), (5, 150, 105, 255))
    c.save("soko_goal.png")

    # 工人 (24x24)
    c = PixelCanvas(24, 24)
    c.draw_circle(12, 7, 5, (254, 215, 170, 255), (245, 158, 11, 255)) # 黄安全帽
    c.fill_rect(8, 12, 8, 10, (37, 99, 235, 255)) # 蓝工装
    c.save("soko_worker.png")

# ============================================================================
# 11. 三国华容道 (Klotski)
# ============================================================================
def make_klotski_sprites():
    # 曹操大帅印 (76x76)
    c = PixelCanvas(76, 76)
    c.draw_beveled_box(0, 0, 76, 76, (220, 38, 38, 255), (248, 113, 113, 255), (153, 27, 27, 255), (69, 10, 10, 255))
    c.stroke_rect(6, 6, 64, 64, (250, 204, 21, 255))
    c.save("klotski_caocao.png")

    # 关羽横块 (76x36)
    c = PixelCanvas(76, 36)
    c.draw_beveled_box(0, 0, 76, 36, (6, 182, 212, 255), (103, 232, 249, 255), (14, 116, 144, 255), (8, 47, 73, 255))
    c.stroke_rect(4, 4, 68, 28, (250, 204, 21, 255))
    c.save("klotski_guanyu.png")

    # 四虎将竖块 (36x76)
    for name, col in [("klotski_general_orange.png", (249, 115, 22, 255)), ("klotski_general_green.png", (16, 185, 129, 255)),
                      ("klotski_general_purple.png", (168, 85, 247, 255)), ("klotski_general_blue.png", (59, 130, 246, 255))]:
        c = PixelCanvas(36, 76)
        c.draw_beveled_box(0, 0, 36, 76, col, (255, 255, 255, 120), (0, 0, 0, 100), (15, 23, 42, 255))
        c.stroke_rect(4, 4, 28, 68, (250, 204, 21, 255))
        c.save(name)

    # 小兵 (36x36)
    c = PixelCanvas(36, 36)
    c.draw_beveled_box(0, 0, 36, 36, (234, 179, 8, 255), (253, 224, 71, 255), (161, 98, 7, 255), (69, 26, 3, 255))
    c.save("klotski_soldier.png")

# ============================================================================
# 12. 五子棋 (Gomoku)
# ============================================================================
def make_gomoku_sprites():
    # 黑子 (22x22)
    c = PixelCanvas(22, 22)
    c.draw_circle(11, 11, 10, (15, 23, 42, 255), (2, 6, 23, 255))
    # 弧形圆润高光
    c.draw_circle(8, 8, 4, (51, 65, 85, 255))
    c.set(7, 7, (148, 163, 184, 255))
    c.save("gomoku_stone_black.png")

    # 白子 (22x22)
    c = PixelCanvas(22, 22)
    c.draw_circle(11, 11, 10, (248, 250, 252, 255), (203, 213, 225, 255))
    c.draw_circle(8, 8, 4, (255, 255, 255, 255))
    c.save("gomoku_stone_white.png")

# ============================================================================
# 13. 经典井字棋 (Tic-Tac-Toe)
# ============================================================================
def make_tictactoe_sprites():
    # 红色 3D 霓虹 X (44x44)
    c = PixelCanvas(44, 44)
    for i in range(8, 36):
        for off in (-2, -1, 0, 1, 2):
            c.set(i + off, i, (239, 68, 68, 255))
            c.set(43 - i + off, i, (239, 68, 68, 255))
    c.save("ttt_x.png")

    # 蓝色 3D 霓虹 O (44x44)
    c = PixelCanvas(44, 44)
    c.draw_circle(22, 22, 16, (59, 130, 246, 255))
    c.draw_circle(22, 22, 11, (0, 0, 0, 0))  # 镂空中心
    c.save("ttt_o.png")

# ============================================================================
# 14. 极速跑酷 (Speed Runner)
# ============================================================================
def make_runner_sprites():
    # 霓虹跑酷主角 (32x36)
    c = PixelCanvas(32, 36)
    # 青蓝头盔面罩
    c.draw_circle(16, 9, 7, (99, 102, 241, 255), (67, 56, 202, 255))
    c.fill_rect(12, 8, 8, 3, (56, 189, 248, 255)) # 护目镜
    # 运动身躯与动感腿部
    c.fill_rect(12, 16, 8, 12, (79, 70, 229, 255))
    c.fill_rect(8, 26, 6, 8, (244, 63, 94, 255))  # 运动鞋
    c.fill_rect(18, 26, 6, 8, (244, 63, 94, 255))
    c.save("runner_player.png")

    # 警示路障 (32x32)
    c = PixelCanvas(32, 32)
    c.draw_beveled_box(0, 0, 32, 32, (239, 68, 68, 255), (248, 113, 113, 255), (185, 28, 28, 255), (69, 10, 10, 255))
    c.fill_rect(6, 6, 20, 20, (250, 204, 21, 255))
    # 惊叹号
    c.fill_rect(14, 10, 4, 8, (15, 23, 42, 255))
    c.fill_rect(14, 21, 4, 4, (15, 23, 42, 255))
    c.save("runner_hurdle.png")

    # 金色五角星 (24x24)
    c = PixelCanvas(24, 24)
    c.draw_circle(12, 12, 9, (250, 204, 21, 255), (202, 138, 4, 255))
    c.fill_rect(8, 8, 8, 8, (254, 240, 138, 255))
    c.save("runner_star.png")

# ============================================================================
# 15. 跳一跳 (Jump Jump)
# ============================================================================
def make_jump_sprites():
    # 经典紫色棋子跳棋 (24x36)
    c = PixelCanvas(24, 36)
    c.draw_circle(12, 8, 6, (147, 51, 234, 255), (107, 33, 168, 255)) # 头部圆球
    c.fill_rect(9, 14, 6, 6, (126, 34, 206, 255))
    c.draw_circle(12, 26, 8, (147, 51, 234, 255), (88, 28, 135, 255)) # 底座圆柱
    c.save("jump_pawn.png")

# ============================================================================
# 16. 鹈鹕骑单车 (Pelican Bike)
# ============================================================================
def make_pelican_sprites():
    # 鹈鹕大嘴鸟骑车 (56x40)
    c = PixelCanvas(56, 40)
    # 鹈鹕大嘴与头部
    c.draw_circle(24, 12, 8, (241, 245, 249, 255), (203, 213, 225, 255))
    c.fill_rect(28, 10, 16, 7, (249, 115, 22, 255)) # 标志性橙色大嘴囊
    c.set(24, 10, (15, 23, 42, 255)) # 眼睛
    # 身体
    c.draw_circle(20, 22, 9, (241, 245, 249, 255), (203, 213, 225, 255))
    # 自行车车轮 (前后两轮)
    c.draw_circle(10, 32, 6, (71, 85, 105, 255), (15, 23, 42, 255))
    c.draw_circle(36, 32, 6, (71, 85, 105, 255), (15, 23, 42, 255))
    # 车架红梁
    c.fill_rect(10, 31, 26, 2, (220, 38, 38, 255))
    c.save("pelican_rider.png")

    # 飞鱼 (24x16)
    c = PixelCanvas(24, 16)
    c.draw_circle(12, 8, 6, (56, 189, 248, 255), (2, 132, 199, 255))
    c.fill_rect(2, 6, 6, 4, (14, 165, 233, 255)) # 鱼尾
    c.save("pelican_fish.png")

# ============================================================================
# 17. 游戏大厅全 16 款高精度封面徽章 (Hub Badges - 64x64)
# ============================================================================
HUB_GAMES = [
    ("badge_tetris.png", "俄罗斯方块", (6, 182, 212, 255), (14, 116, 144, 255), "tetris"),
    ("badge_minesweeper.png", "扫雷", (14, 165, 233, 255), (3, 105, 161, 255), "mine"),
    ("badge_snake.png", "贪吃蛇", (34, 197, 94, 255), (21, 128, 61, 255), "snake"),
    ("badge_flappy.png", "像素飞鸟", (245, 158, 11, 255), (180, 83, 9, 255), "bird"),
    ("badge_watermelon.png", "合成西瓜", (16, 185, 129, 255), (4, 120, 87, 255), "melon"),
    ("badge_tictactoe.png", "井字棋", (59, 130, 246, 255), (29, 78, 216, 255), "ttt"),
    ("badge_match3.png", "消消乐", (236, 72, 153, 255), (190, 24, 93, 255), "gem"),
    ("badge_miner.png", "黄金矿工", (217, 119, 6, 255), (146, 64, 14, 255), "gold"),
    ("badge_runner.png", "极速跑酷", (99, 102, 241, 255), (67, 56, 202, 255), "run"),
    ("badge_mario.png", "马里奥", (225, 29, 72, 255), (159, 18, 57, 255), "mario"),
    ("badge_dino.png", "谷歌恐龙", (20, 184, 166, 255), (15, 118, 110, 255), "dino"),
    ("badge_gomoku.png", "五子棋", (100, 116, 139, 255), (51, 65, 85, 255), "go"),
    ("badge_sokoban.png", "推箱子", (180, 83, 9, 255), (120, 53, 15, 255), "box"),
    ("badge_klotski.png", "华容道", (239, 68, 68, 255), (185, 28, 28, 255), "klot"),
    ("badge_jump.png", "跳一跳", (139, 92, 246, 255), (109, 40, 217, 255), "jump"),
    ("badge_pelican.png", "鹈鹕骑车", (249, 115, 22, 255), (194, 65, 12, 255), "peli")
]

def make_hub_badges():
    for filename, title, border, dark, tag in HUB_GAMES:
        c = PixelCanvas(64, 64)
        c.draw_beveled_box(0, 0, 64, 64, (19, 29, 49, 255), border, dark, dark)
        c.stroke_rect(2, 2, 60, 60, border)
        # 居中标志图形
        if tag == "tetris":
            c.draw_beveled_box(16, 16, 16, 16, (6, 182, 212, 255), (103, 232, 249, 255), (14, 116, 144, 255))
            c.draw_beveled_box(32, 16, 16, 16, (234, 179, 8, 255), (253, 224, 71, 255), (161, 98, 7, 255))
            c.draw_beveled_box(32, 32, 16, 16, (239, 68, 68, 255), (252, 165, 165, 255), (185, 28, 28, 255))
        elif tag == "mine":
            c.draw_circle(32, 32, 14, (15, 23, 42, 255), (220, 38, 38, 255))
            c.fill_rect(28, 28, 8, 8, (220, 38, 38, 255))
        elif tag == "snake":
            c.draw_circle(24, 32, 8, (34, 197, 94, 255))
            c.draw_circle(40, 32, 8, (74, 222, 128, 255))
            c.draw_circle(32, 18, 5, (239, 68, 68, 255)) # 苹果
        elif tag == "bird":
            c.draw_circle(32, 32, 12, (250, 204, 21, 255))
            c.fill_rect(38, 28, 10, 6, (249, 115, 22, 255)) # 嘴
            c.set(34, 26, (15, 23, 42, 255)) # 眼
        elif tag == "melon":
            c.draw_circle(32, 32, 16, (34, 197, 94, 255), (20, 83, 45, 255))
            c.fill_rect(28, 20, 8, 24, (20, 83, 45, 255))
        elif tag == "mario":
            c.draw_beveled_box(20, 20, 24, 24, (234, 179, 8, 255), (253, 224, 71, 255), (161, 98, 7, 255))
            c.fill_rect(30, 26, 4, 12, (255, 255, 255, 255))
        elif tag == "dino":
            c.fill_rect(20, 20, 24, 18, (16, 185, 129, 255))
            c.set(38, 22, (255, 255, 255, 255))
            c.fill_rect(24, 38, 4, 8, (16, 185, 129, 255))
            c.fill_rect(32, 38, 4, 8, (16, 185, 129, 255))
        else:
            c.draw_circle(32, 32, 14, border, dark)
        c.save(filename)

def main():
    print("开始全量生成 16-bit 像素艺术高清素材...")
    make_mario_sprites()
    make_dino_sprites()
    make_flappy_sprites()
    make_minesweeper_sprites()
    make_snake_sprites()
    make_miner_sprites()
    make_watermelon_sprites()
    make_tetris_sprites()
    make_match3_sprites()
    make_sokoban_sprites()
    make_klotski_sprites()
    make_gomoku_sprites()
    make_tictactoe_sprites()
    make_runner_sprites()
    make_jump_sprites()
    make_pelican_sprites()
    make_hub_badges()
    print("✅ 全套素材生成完毕！")

if __name__ == "__main__":
    main()
