import struct
import re

# Parse quickjs-opcode.h
opcodes = {}
with open("/Users/fuzihao/.gemini/antigravity/scratch/ydpen/ydpen-toolkit/assets/quickjs/quickjs-opcode.h") as f:
    idx = 0
    for line in f:
        line = line.strip()
        m = re.match(r"DEF\(\s*(\w+)\s*,\s*(\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(\w+)\s*\)", line)
        if m:
            name, size, n_pop, n_push, fmt = m.groups()
            opcodes[idx] = (name, int(size), fmt)
            idx += 1

with open("/tmp/penbili_clean_aarch64/index.js.bin", "rb") as f:
    data = f.read()

def read_leb128(b, offset):
    val = 0
    shift = 0
    while True:
        byte = b[offset]
        offset += 1
        val |= (byte & 0x7f) << shift
        if not (byte & 0x80): break
        shift += 7
    return val, offset

offset = 1
atom_count, offset = read_leb128(data, offset)
atoms = []
for i in range(atom_count):
    str_len, offset = read_leb128(data, offset)
    is_wide = (str_len & 1)
    str_len >>= 1
    if is_wide:
        s = data[offset:offset + str_len * 2].decode("utf-16le", errors="ignore")
        offset += str_len * 2
    else:
        s = data[offset:offset + str_len].decode("latin1", errors="ignore")
        offset += str_len
    atoms.append(s)

def disasm(pc, count=40):
    for _ in range(count):
        if pc >= len(data): break
        op = data[pc]
        if op not in opcodes:
            print(f"0x{pc:04x}: UNKNOWN OP 0x{op:02x}")
            pc += 1
            continue
        name, sz, fmt = opcodes[op]
        args_str = ""
        if fmt == "atom" and pc + 5 <= len(data):
            aid = struct.unpack("<I", data[pc+1:pc+5])[0]
            astr = atoms[aid] if aid < len(atoms) else f"atom_{aid}"
            args_str = f"atom[{aid}]={repr(astr)}"
        elif fmt == "u8" and pc + 2 <= len(data):
            args_str = f"{data[pc+1]}"
        elif fmt == "u16" and pc + 3 <= len(data):
            args_str = f"{struct.unpack('<H', data[pc+1:pc+3])[0]}"
        elif fmt == "i32" and pc + 5 <= len(data):
            args_str = f"{struct.unpack('<i', data[pc+1:pc+5])[0]}"
        print(f"0x{pc:04x}: {name:20s} {args_str}")
        pc += sz

print("Disassembling around 0x12880:")
disasm(0x12880, 50)
