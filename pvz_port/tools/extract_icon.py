#!/usr/bin/env python3
"""Extract the authentic game icon from the original PlantsVsZombies.exe (PE RT_ICON).

Pure standard library. Writes the largest icon as a .ico; convert to PNG with sips.
"""
import struct
import sys
from pathlib import Path


def rva_to_off(rva, sections):
    for name, vsize, vaddr, rawsize, rawptr in sections:
        if vaddr <= rva < vaddr + max(vsize, rawsize):
            return rawptr + (rva - vaddr)
    raise ValueError('rva not mapped: %x' % rva)


def parse_resources(data, base, off, level, out, path=()):
    # IMAGE_RESOURCE_DIRECTORY
    named, ident = struct.unpack_from('<HH', data, off + 12)
    pos = off + 16
    for _ in range(named + ident):
        name_id, offset_to_data = struct.unpack_from('<II', data, pos)
        pos += 8
        is_dir = bool(offset_to_data & 0x80000000)
        offset_to_data &= 0x7FFFFFFF
        if name_id & 0x80000000:
            # named entry: read unicode name
            noff = base + (name_id & 0x7FFFFFFF)
            nlen = struct.unpack_from('<H', data, noff)[0]
            name = data[noff + 2:noff + 2 + nlen * 2].decode('utf-16-le', 'replace')
        else:
            name = name_id
        newpath = path + (name,)
        if is_dir:
            parse_resources(data, base, base + offset_to_data, level + 1, out, newpath)
        else:
            de = base + offset_to_data
            data_rva, size, codepage, _ = struct.unpack_from('<IIII', data, de)
            doff = rva_to_off(data_rva, SECTIONS)
            out[newpath] = data[doff:doff + size]


exe = Path(sys.argv[1])
data = exe.read_bytes()
pe_off = struct.unpack_from('<I', data, 0x3C)[0]
assert data[pe_off:pe_off + 4] == b'PE\0\0', 'not a PE'
coff = pe_off + 4
num_sections = struct.unpack_from('<H', data, coff + 2)[0]
opt_size = struct.unpack_from('<H', data, coff + 16)[0]
opt = coff + 20
magic = struct.unpack_from('<H', data, opt)[0]
dd_off = opt + (96 if magic == 0x10b else 112)
res_rva, res_size = struct.unpack_from('<II', data, dd_off + 2 * 8)
sec_off = opt + opt_size
SECTIONS = []
for i in range(num_sections):
    s = sec_off + i * 40
    name = data[s:s + 8].rstrip(b'\0').decode('ascii', 'replace')
    vsize, vaddr, rawsize, rawptr = struct.unpack_from('<IIII', data, s + 8)
    SECTIONS.append((name, vsize, vaddr, rawsize, rawptr))
res_base = rva_to_off(res_rva, SECTIONS)
out = {}
parse_resources(data, res_base, res_base, 0, out)

# RT_GROUP_ICON=14, RT_ICON=3 ; keys are (type, name, lang)
groups = {k: v for k, v in out.items() if k[0] == 14}
icons = {k[1]: v for k, v in out.items() if k[0] == 3}
if not groups:
    print('NO GROUP ICON FOUND; resource types:', sorted({k[0] for k in out}))
    sys.exit(2)
gkey = next(iter(groups))
g = groups[gkey]
reserved, typ, count = struct.unpack_from('<HHH', g, 0)
entries = []
for i in range(count):
    e = 6 + i * 14
    w, h, cc, rsv, planes, bc, bytes_in_res, nid = struct.unpack_from('<BBBBHHIH', g, e)
    entries.append((w, h, planes, bc, bytes_in_res, nid))
# choose the largest icon by pixel area (prefer 32bit)
best = max(entries, key=lambda e: ((e[0] or 256) * (e[1] or 256), e[3]))
w, h, planes, bc, bytes_in_res, nid = best
img = icons.get(nid)
if img is None:
    print('icon id %s not found; have %s' % (nid, list(icons)[:10]))
    sys.exit(3)
# build single-image .ico
ico = struct.pack('<HHH', 0, 1, 1)
ico += struct.pack('<BBBBHHII', w, h, 0, 0, planes, bc, len(img), 22)
ico += img
outpath = Path(sys.argv[2])
outpath.write_bytes(ico)
print('extracted icon %dx%d %dbpp %d bytes -> %s' % (w or 256, h or 256, bc, len(img), outpath))