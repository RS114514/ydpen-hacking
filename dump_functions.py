import struct

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

print(f"Read {len(atoms)} atoms. Bytecode starts at 0x{offset:04x}")

# Search for the function that references infoTitle
target = struct.pack("<I", 193)
p = 0
while True:
    idx = data.find(target, p)
    if idx == -1: break
    print(f"infoTitle found at 0x{idx:04x}")
    # print 30 bytes before and 50 bytes after
    sub = data[idx-20:idx+40]
    print("  Hex:", sub.hex())
    p = idx + 1
