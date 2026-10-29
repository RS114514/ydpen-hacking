import socket
import time
import subprocess
import os

ARTIFACT_DIR = "/Users/fuzihao/.gemini/antigravity/brain/48b7d488-fbd0-4fd4-bb28-96dff6804fd1"
ADB = "/opt/homebrew/bin/adb"

def tap(x, y, d=50):
    try:
        s = socket.socket()
        s.settimeout(2)
        s.connect(('127.0.0.1', 19999))
        s.sendall(f"T {x} {y} {d}\n".encode())
        s.close()
    except Exception as e:
        print(f"Tap error ({x}, {y}): {e}")
    time.sleep(0.5)

def capture(name):
    remote = f"/tmp/{name}.png"
    local = os.path.join(ARTIFACT_DIR, f"{name}.png")
    subprocess.run([ADB, "shell", f"miniapp_cli capture {remote}"], stdout=subprocess.DEVNULL)
    subprocess.run([ADB, "pull", remote, local], stdout=subprocess.DEVNULL)
    print(f"Captured: {name} -> {local}")
    return local

def back_to_hub():
    tap(35, 14)
    time.sleep(0.5)

def set_page(p):
    if p == 1:
        tap(558, 20)
    else:
        tap(648, 20)
    time.sleep(0.5)

CARDS = [
    (95, 75),   # 1
    (251, 75),  # 2
    (407, 75),  # 3
    (563, 75),  # 4
    (95, 165),  # 5
    (251, 165), # 6
    (407, 165), # 7
    (563, 165), # 8
]

def open_card(idx):
    # idx 1..8
    x, y = CARDS[idx - 1]
    tap(x, y)
    time.sleep(0.6)
