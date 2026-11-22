#!/usr/bin/env python3
"""Host-side validation of the 32-bit compiled definition reader logic.

Mirrors Compute32Layout / CalcHash32 / ReadMap32 added to PvzpLib/Definition.cpp
and runs them against real original .reanim.compiled files from main.pak.
"""
import struct
import sys
import zlib
from pathlib import Path

INVALID, INT, FLOAT, STRING, ENUM, VECTOR2, ARRAY, TRACK, FLAGS, IMAGE, FONT = range(11)

TRANSFORM = [("x", FLOAT), ("y", FLOAT), ("kx", FLOAT), ("ky", FLOAT),
             ("sx", FLOAT), ("sy", FLOAT), ("f", FLOAT), ("a", FLOAT),
             ("i", IMAGE), ("font", FONT), ("text", STRING)]
TRACKDEF = [("name", STRING), ("t", ARRAY, TRANSFORM)]
REANIM = [("track", ARRAY, TRACKDEF), ("fps", FLOAT)]


def size32(t):
    if t in (STRING, IMAGE, FONT):
        return 4
    if t in (ARRAY, TRACK, VECTOR2):
        return 8
    return 4


def layout(fields):
    offs, sizes, end = [], [], 0
    for f in fields:
        off = (end + 3) & ~3
        sz = size32(f[1])
        offs.append(off)
        sizes.append(sz)
        end = off + sz
    return offs, sizes, (end + 3) & ~3


def hash32(h, fields, progress):
    if id(fields) in progress:
        return h
    progress.add(id(fields))
    offs, sizes, total = layout(fields)
    h = zlib.crc32(struct.pack("<i", total), h)
    for i, f in enumerate(fields):
        h = zlib.crc32(struct.pack("<i", f[1]), h)
        h = zlib.crc32(struct.pack("<i", offs[i]), h)
        if f[1] == ARRAY:
            h = hash32(h, f[2], progress)
    return h


def top_hash(fields):
    return hash32(1, fields, set()) & 0xFFFFFFFF


class Reader:
    def __init__(self, buf):
        self.b = buf
        self.p = 0

    def take(self, n):
        d = self.b[self.p:self.p + n]
        if len(d) != n:
            raise ValueError("short read")
        self.p += n
        return d

    def i32(self):
        return struct.unpack("<i", self.take(4))[0]

    def string(self):
        n = self.i32()
        return self.take(n).decode("utf-8", "replace")

    def raw32(self, fields):
        offs, sizes, total = layout(fields)
        base = self.p
        out = {}
        for i, f in enumerate(fields):
            if f[1] == ARRAY:
                out[f[0]] = struct.unpack("<i", self.b[base + offs[i] + 4:base + offs[i] + 8])[0]
            elif f[1] == TRACK:
                out[f[0]] = struct.unpack("<i", self.b[base + offs[i]:base + offs[i] + 4])[0]
            elif f[1] in (STRING, IMAGE, FONT):
                pass
            else:
                out[f[0]] = struct.unpack("<f", self.b[base + offs[i]:base + offs[i] + 4])[0]
        self.p = base + total
        return out

    def serialized(self, fields, raw):
        out = {}
        for f in fields:
            if f[1] in (STRING, IMAGE, FONT):
                out[f[0]] = self.string()
            elif f[1] == TRACK:
                n = self.i32()
                self.take(n * 20)
                out[f[0]] = n
            elif f[1] == ARRAY:
                out[f[0]] = self.array(f[2], raw[f[0]])
        return out

    def array(self, sub, count):
        defsize = self.i32()
        _, _, total = layout(sub)
        if defsize != total:
            raise ValueError(f"array defsize {defsize} != {total}")
        elems_raw = [self.raw32(sub) for _ in range(count)]
        return [(r, self.serialized(sub, r)) for r in elems_raw]

    def map32(self, fields):
        r = self.raw32(fields)
        return r, self.serialized(fields, r)


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else
                "/Volumes/500GB/qoder_cache/pvz_original/pak_extracted/compiled/reanim")
    files = sorted(p for p in root.glob("*.compiled") if not p.name.startswith("._"))
    if not files:
        print("no compiled files found")
        return 1
    expect = top_hash(REANIM)
    ok = 0
    for p in files[:12]:
        raw = p.read_bytes()
        cookie, usize = struct.unpack("<II", raw[:8])
        if cookie != 0xDEADFED4:
            print(p.name, "bad cookie")
            continue
        data = zlib.decompress(raw[8:])
        if len(data) != usize:
            print(p.name, "size mismatch")
            continue
        stored = struct.unpack("<I", data[:4])[0]
        if stored != expect:
            print(p.name, f"HASH MISMATCH stored={stored:08x} expect={expect:08x}")
            continue
        r = Reader(data[4:])
        try:
            rawdef, ser = r.map32(REANIM)
        except ValueError as e:
            print(p.name, "PARSE FAIL", e)
            continue
        tracks = ser["track"]
        fps = rawdef["fps"]
        names = [t[1]["name"] for t in tracks]
        if not (0 < fps <= 60) or not tracks:
            print(p.name, "implausible", fps, len(tracks))
            continue
        if r.p != len(data):
            print(p.name, f"consumed {r.p} != {len(data)}")
            continue
        ok += 1
        print(f"OK {p.name} fps={fps:g} tracks={len(tracks)} first={names[0]!r}")
    print(f"validated {ok}/{min(len(files), 12)}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
