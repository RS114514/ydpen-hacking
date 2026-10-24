#!/usr/bin/env python3
"""统计 PNG 的非黑/亮像素占比，用于判定真机截图是不是「整页黑」。

为什么需要它：youdao-x5 上最常见的故障是某个 .vue 漏了 <style> 块 —— 该文件样式完全
不进 bundle，页面渲染成「无尺寸的 column flex」→ 整页黑。截图的像素统计是最快的判据
（对比：样式正常时面板约占 43% 非黑）。

只支持 miniapp_cli capture 输出的形态：8bit、非隔行、灰度/RGB/调色板/RGBA。
用法: python png_stat.py <file.png>
"""
import struct
import sys
import zlib


def load_png(path):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    pos = 8
    w = h = bitdepth = colortype = 0
    idat = b""
    plte = b""
    while pos < len(data):
        (ln,) = struct.unpack(">I", data[pos:pos + 4])
        tag = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + ln]
        if tag == b"IHDR":
            w, h, bitdepth, colortype = struct.unpack(">IIBB", body[:10])
            interlace = body[12]
            if interlace != 0:
                raise ValueError("interlaced PNG not supported")
        elif tag == b"IDAT":
            idat += body
        elif tag == b"PLTE":
            plte = body
        elif tag == b"IEND":
            break
        pos += 12 + ln
    if bitdepth != 8:
        raise ValueError("only 8-bit PNG supported (got %d)" % bitdepth)
    raw = zlib.decompress(idat)
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[colortype]
    stride = w * channels
    out = []
    prev = bytearray(stride)
    i = 0
    for _ in range(h):
        f = raw[i]
        i += 1
        line = bytearray(raw[i:i + stride])
        i += stride
        if f == 1:
            for x in range(channels, stride):
                line[x] = (line[x] + line[x - channels]) & 255
        elif f == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = line[x - channels] if x >= channels else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - channels] if x >= channels else 0
                b = prev[x]
                c = prev[x - channels] if x >= channels else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out.append(bytes(line))
        prev = line
    return w, h, colortype, plte, out, channels


def main():
    if len(sys.argv) < 2:
        print("usage: png_stat.py <file.png>")
        return 2
    path = sys.argv[1]
    w, h, colortype, plte, rows, channels = load_png(path)
    total = w * h
    nonblack = 0
    bright = 0
    for line in rows:
        for x in range(0, len(line), channels):
            if colortype == 3:
                idx = line[x]
                r, g, b = plte[idx * 3], plte[idx * 3 + 1], plte[idx * 3 + 2]
            elif colortype in (0, 4):
                r = g = b = line[x]
            else:
                r, g, b = line[x], line[x + 1], line[x + 2]
            s = r + g + b
            if s > 24:
                nonblack += 1
            if s > 300:
                bright += 1
    print("size=%dx%d nonblack=%.1f%% bright=%.1f%%" % (w, h, 100.0 * nonblack / total, 100.0 * bright / total))
    return 0


if __name__ == "__main__":
    sys.exit(main())
