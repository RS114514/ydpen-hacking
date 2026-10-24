#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ydpen_screen.py —— 有道词典笔电脑端实时投屏与远程控制工具
无需第三方依赖，仅使用 Python 3 标准库。

功能：
  1. 通过 KMS 底层硬件抓屏与硬件裁剪旋转（960x266），超低延迟实时投屏
  2. 部署极速 touch server，支持鼠标点击、平滑拖拽滑动、物理按键（电源/返回/主页）
  3. 提供优雅的现代 Web UI (http://127.0.0.1:8088)，自动在浏览器打开
  4. 支持一键截屏保存、画面旋转 180° 动态切换、缩放切换（1x/1.25x/1.5x）、键盘快捷键
  5. 进程自愈与优雅退出：按 Ctrl+C 秒级无死锁安全退出并清理笔端进程
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.parse
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOUCH_SERVER_BIN = os.path.join(SCRIPT_DIR, "ydpen_touch_server")
REMOTE_TOUCH_BIN = "/tmp/ydpen_touch_server"
TOUCH_PORT = 19999
STREAM_PORT = 18888
HTTP_PORT = 8088

# --------------------------------------------------------------------------- ADB 工具
def find_adb() -> str:
    adb_path = shutil.which("adb")
    if adb_path:
        return adb_path
    candidates = [
        os.path.join(SCRIPT_DIR, "tools", "platform-tools", "adb.exe"),
        os.path.join(SCRIPT_DIR, "tools", "platform-tools", "adb"),
        "/usr/local/bin/adb",
        "/opt/homebrew/bin/adb",
        os.path.expanduser("~/Library/Android/sdk/platform-tools/adb"),
    ]
    for c in candidates:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return "adb"

ADB_CMD = find_adb()
CURRENT_DEVICE: str | None = None

def adb_run(args: list[str], timeout: int = 15, dev_id: str | None = None) -> tuple[int, str]:
    target = dev_id or CURRENT_DEVICE
    if target and (not args or args[0] != "devices"):
        cmd = [ADB_CMD, "-s", target] + args
    else:
        cmd = [ADB_CMD] + args
    try:
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=timeout)
        return p.returncode, p.stdout.strip()
    except subprocess.TimeoutExpired:
        return -1, "命令执行超时"
    except Exception as e:
        return -1, f"执行异常: {e}"

def check_device(serial: str | None = None) -> str:
    code, out = adb_run(["devices"])
    if code != 0:
        raise RuntimeError(f"ADB 不可用: {out}")
    lines = [line.strip() for line in out.splitlines() if line.strip() and not line.startswith("List")]
    devices = [l.split()[0] for l in lines if "device" in l]
    if not devices:
        raise RuntimeError("未检测到已连接的词典笔设备，请检查 USB 连接并在笔上开启 ADB。")
    if serial:
        if serial in devices:
            return serial
        raise RuntimeError(f"指定的设备 {serial} 未连接。当前可用设备: {', '.join(devices)}")
    if len(devices) > 1:
        usb_devices = [d for d in devices if ":" not in d]
        selected = usb_devices[0] if usb_devices else devices[0]
        print(f"[提示] 检测到多台在线设备 ({', '.join(devices)})，自动优先选用 USB 链路: {selected}")
        return selected
    return devices[0]

# --------------------------------------------------------------------------- 远程触控客户端
class TouchClient:
    def __init__(self, port: int = TOUCH_PORT):
        self.port = port
        self.sock: socket.socket | None = None
        self.lock = threading.Lock()

    def connect(self) -> bool:
        with self.lock:
            if self.sock:
                try:
                    self.sock.close()
                except Exception:
                    pass
                self.sock = None
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2.0)
                s.connect(("127.0.0.1", self.port))
                s.settimeout(None)
                self.sock = s
                return True
            except Exception:
                return False

    def send(self, cmd: str):
        with self.lock:
            if not self.sock:
                if not self.connect():
                    return
            try:
                self.sock.sendall((cmd.strip() + "\n").encode())
            except Exception:
                self.sock = None
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(2.0)
                    s.connect(("127.0.0.1", self.port))
                    s.settimeout(None)
                    self.sock = s
                    self.sock.sendall((cmd.strip() + "\n").encode())
                except Exception:
                    pass

    def tap(self, x: int, y: int, dur_ms: int = 60):
        self.send(f"T {x} {y} {dur_ms}")

    def down(self, x: int, y: int):
        self.send(f"D {x} {y}")

    def move(self, x: int, y: int):
        self.send(f"M {x} {y}")

    def up(self):
        self.send("U")

    def swipe(self, x1: int, y1: int, x2: int, y2: int, dur_ms: int = 250):
        self.send(f"S {x1} {y1} {x2} {y2} {dur_ms}")

    def key(self, key_name: str):
        self.send(f"K {key_name}")

    def close(self):
        with self.lock:
            if self.sock:
                try:
                    self.sock.close()
                except Exception:
                    pass
                self.sock = None

# --------------------------------------------------------------------------- 屏幕流捕获器
class ScreenStreamer:
    def __init__(self, port: int = STREAM_PORT):
        self.port = port
        self.running = False
        self.is_connected = False
        self.latest_frame: bytes | None = None
        self.frame_lock = threading.Lock()
        self.frame_event = threading.Event()
        self.fps = 0.0
        self.frame_count = 0
        self.thread: threading.Thread | None = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def _capture_loop(self):
        last_calc_time = time.time()
        calc_frames = 0
        last_status = None

        while self.running:
            # 尝试连接视频流端口
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(3.0)
                s.connect(("127.0.0.1", self.port))
                s.settimeout(None)
            except Exception:
                if last_status != "waiting":
                    print("[ScreenStreamer] 等待推流就绪...")
                    last_status = "waiting"
                time.sleep(0.8)
                continue

            buf = bytearray()
            first_frame_got = False

            while self.running:
                try:
                    chunk = s.recv(16384)
                    if not chunk:
                        break
                    buf.extend(chunk)

                    while True:
                        soi = buf.find(b"\xff\xd8")
                        if soi == -1:
                            buf.clear()
                            break
                        eoi = buf.find(b"\xff\xd9", soi)
                        if eoi == -1:
                            if soi > 0:
                                del buf[:soi]
                            break

                        frame = bytes(buf[soi : eoi + 2])
                        del buf[: eoi + 2]

                        with self.frame_lock:
                            self.latest_frame = frame
                            self.frame_count += 1
                        self.frame_event.set()

                        if not first_frame_got:
                            first_frame_got = True
                            self.is_connected = True
                            if last_status != "connected":
                                print("[ScreenStreamer] 视频流连接成功！")
                                last_status = "connected"

                        calc_frames += 1
                        now = time.time()
                        if now - last_calc_time >= 1.0:
                            self.fps = calc_frames / (now - last_calc_time)
                            calc_frames = 0
                            last_calc_time = now

                except Exception:
                    break

            self.is_connected = False
            try:
                s.close()
            except Exception:
                pass

            if self.running and last_status != "disconnected":
                print("[ScreenStreamer] 视频流暂时中断，正在重连...")
                last_status = "disconnected"
            time.sleep(0.8)

    def stop(self):
        self.running = False

    def get_latest_frame(self) -> bytes | None:
        with self.frame_lock:
            return self.latest_frame

# --------------------------------------------------------------------------- Web UI 前端与 HTTP 服务
HTML_PAGE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>有道词典笔远程操作台</title>
<style>
  :root {
    --bg-color: #121316;
    --card-bg: #1c1d22;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
    --text-primary: #f3f4f6;
    --text-secondary: #9ca3af;
    --border: #2e3138;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: var(--bg-color);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    padding: 24px;
    user-select: none;
  }
  header {
    width: 100%;
    max-width: 1100px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 0 8px;
  }
  .title-group h1 {
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .title-group p {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
  .badge-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .badge {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    background: #20242c;
    border: 1px solid var(--border);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .badge.online { color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
  .badge.fps { color: #60a5fa; }

  /* 词典笔仿真硬件外壳 */
  .device-container {
    background: linear-gradient(145deg, #2a2c33, #18191d);
    padding: 22px 34px;
    border-radius: 46px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);
    position: relative;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .device-bezel {
    background: #000;
    padding: 10px 14px;
    border-radius: 18px;
    border: 2px solid #33363e;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
    position: relative;
  }
  .screen-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    cursor: crosshair;
    background: #050505;
    line-height: 0;
  }
  #pen-screen {
    display: block;
    width: 960px;
    height: 266px;
    object-fit: fill;
    transition: transform 0.2s ease, width 0.15s ease, height 0.15s ease;
  }
  #pen-screen.flipped {
    transform: rotate(180deg);
  }
  .touch-ripple {
    position: absolute;
    width: 24px;
    height: 24px;
    margin-left: -12px;
    margin-top: -12px;
    border-radius: 50%;
    background: rgba(37, 99, 235, 0.4);
    border: 2px solid #60a5fa;
    pointer-events: none;
    transform: scale(0.6);
    opacity: 1;
    transition: transform 0.25s ease-out, opacity 0.25s ease-out;
  }
  .touch-ripple.active {
    transform: scale(1.6);
    opacity: 0;
  }

  /* 快捷控制面板 */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    background: var(--card-bg);
    padding: 12px 18px;
    border-radius: 16px;
    border: 1px solid var(--border);
    max-width: 1100px;
    width: 100%;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
  }
  .btn-group {
    display: flex;
    gap: 8px;
  }
  .btn {
    background: #272a31;
    color: var(--text-primary);
    border: 1px solid var(--border);
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
  }
  .btn:hover {
    background: #32363f;
    border-color: #4b5563;
  }
  .btn:active {
    transform: translateY(1px);
  }
  .btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
  }
  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
  }
  .btn.primary:hover {
    background: var(--accent-hover);
  }
  .divider {
    width: 1px;
    height: 24px;
    background: var(--border);
    margin: 0 4px;
  }

  /* 快捷键说明卡片 */
  .hints {
    display: flex;
    gap: 20px;
    font-size: 12px;
    color: var(--text-secondary);
    max-width: 1100px;
    width: 100%;
    justify-content: center;
  }
  .hint-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  kbd {
    background: #272a31;
    border: 1px solid var(--border);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 11px;
    color: #e5e7eb;
  }
</style>
</head>
<body>

<header>
  <div class="title-group">
    <h1>🖊️ 有道词典笔远程操作台</h1>
    <p>实时画面镜像 · 鼠标手势远程触控 · KMS 硬件抓屏</p>
  </div>
  <div class="badge-group">
    <div class="badge online"><span>●</span> <span id="status-text">已连接 (RK3562)</span></div>
    <div class="badge fps">⚡ <span id="fps-val">0.0</span> FPS</div>
    <div class="badge">📐 960 × 266</div>
  </div>
</header>

<div class="device-container">
  <div class="device-bezel">
    <div class="screen-wrapper" id="screen-wrapper">
      <img id="pen-screen" src="/stream" alt="词典笔实时画面" draggable="false">
    </div>
  </div>
</div>

<div class="toolbar">
  <div class="btn-group">
    <button class="btn" onclick="sendKey('back')" title="模拟左滑返回手势 (Esc)">⬅️ 返回</button>
    <button class="btn" onclick="sendKey('home')" title="返回主界面 (Home)">🏠 主页</button>
    <button class="btn" onclick="sendKey('power')" title="电源/亮屏/息屏 (Space)">⚡ 唤醒/息屏</button>
  </div>
  <div class="divider"></div>
  <div class="btn-group">
    <button class="btn" onclick="sendSwipe(700, 133, 200, 133, 220)" title="向左划动 (下一页)">◀️ 左滑卡片</button>
    <button class="btn" onclick="sendSwipe(200, 133, 700, 133, 220)" title="向右划动 (上一页)">▶️ 右滑卡片</button>
  </div>
  <div class="divider"></div>
  <div class="btn-group">
    <button class="btn" id="rotate-btn" onclick="toggleRotation()" title="旋转画面与触控 180 度">🔄 旋转 180°</button>
  </div>
  <div class="divider"></div>
  <div class="btn-group">
    <button class="btn" onclick="setScale(1.0)">1.0x</button>
    <button class="btn" onclick="setScale(1.25)">1.25x</button>
    <button class="btn" onclick="setScale(1.5)">1.5x</button>
  </div>
  <div class="divider"></div>
  <div class="btn-group">
    <button class="btn primary" onclick="takeScreenshot()">📸 截图标存</button>
    <button class="btn" onclick="reloadStream()">🔄 重载画面</button>
  </div>
</div>

<div class="hints">
  <div class="hint-item"><kbd>鼠标左键</kbd> 点击与拖动滑动</div>
  <div class="hint-item"><kbd>鼠标右键</kbd> 或 <kbd>Esc</kbd> 返回</div>
  <div class="hint-item"><kbd>Space</kbd> 唤醒/息屏</div>
  <div class="hint-item"><kbd>←</kbd> / <kbd>→</kbd> 翻页</div>
</div>

<script>
  const screen = document.getElementById('pen-screen');
  const wrapper = document.getElementById('screen-wrapper');
  const fpsVal = document.getElementById('fps-val');
  const rotateBtn = document.getElementById('rotate-btn');
  
  let isMouseDown = false;
  let startX = 0, startY = 0;
  let startTime = 0;
  let hasMoved = false;
  let isFlipped = false;

  function toggleRotation() {
    isFlipped = !isFlipped;
    if (isFlipped) {
      screen.classList.add('flipped');
      rotateBtn.classList.add('active');
    } else {
      screen.classList.remove('flipped');
      rotateBtn.classList.remove('active');
    }
  }

  function getPenCoords(e) {
    const rect = screen.getBoundingClientRect();
    const scaleX = 960 / rect.width;
    const scaleY = 266 / rect.height;
    let x = Math.round((e.clientX - rect.left) * scaleX);
    let y = Math.round((e.clientY - rect.top) * scaleY);
    x = Math.max(0, Math.min(959, x));
    y = Math.max(0, Math.min(265, y));

    // 如果启用了 180 度翻转，自动反转触控坐标
    if (isFlipped) {
      x = 959 - x;
      y = 265 - y;
    }
    return { x, y };
  }

  function showRipple(clientX, clientY) {
    const rect = wrapper.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.left = (clientX - rect.left) + 'px';
    ripple.style.top = (clientY - rect.top) + 'px';
    wrapper.appendChild(ripple);
    requestAnimationFrame(() => {
      ripple.classList.add('active');
    });
    setTimeout(() => ripple.remove(), 260);
  }

  function postTouch(data) {
    fetch('/api/touch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.error(err));
  }

  wrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isMouseDown = true;
    hasMoved = false;
    startTime = Date.now();
    const { x, y } = getPenCoords(e);
    startX = x; startY = y;
    showRipple(e.clientX, e.clientY);
    postTouch({ type: 'down', x, y });
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const { x, y } = getPenCoords(e);
    if (Math.abs(x - startX) > 4 || Math.abs(y - startY) > 4) {
      hasMoved = true;
    }
    postTouch({ type: 'move', x, y });
  });

  window.addEventListener('mouseup', (e) => {
    if (!isMouseDown) return;
    isMouseDown = false;
    const { x, y } = getPenCoords(e);
    const dur = Date.now() - startTime;
    if (!hasMoved && dur < 350) {
      postTouch({ type: 'tap', x, y });
    } else {
      postTouch({ type: 'up' });
    }
  });

  wrapper.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    sendKey('back');
  });

  function sendKey(key) {
    postTouch({ type: 'key', key });
  }

  function sendSwipe(x1, y1, x2, y2, dur) {
    if (isFlipped) {
      x1 = 959 - x1; y1 = 265 - y1;
      x2 = 959 - x2; y2 = 265 - y2;
    }
    postTouch({ type: 'swipe', x1, y1, x2, y2, dur });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      sendKey('back');
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      sendKey('power');
    } else if (e.key === 'Home') {
      sendKey('home');
    } else if (e.key === 'ArrowLeft') {
      sendSwipe(700, 133, 200, 133, 220);
    } else if (e.key === 'ArrowRight') {
      sendSwipe(200, 133, 700, 133, 220);
    }
  });

  function setScale(s) {
    screen.style.width = Math.round(960 * s) + 'px';
    screen.style.height = Math.round(266 * s) + 'px';
  }

  function reloadStream() {
    screen.src = '/stream?t=' + Date.now();
  }

  function takeScreenshot() {
    const a = document.createElement('a');
    a.href = '/api/screenshot?t=' + Date.now();
    a.download = `ydpen_screenshot_${Date.now()}.jpg`;
    a.click();
  }

  setInterval(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(d => {
        fpsVal.innerText = d.fps.toFixed(1);
      })
      .catch(() => {});
  }, 1000);
</script>
</body>
</html>
"""

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

def make_request_handler(streamer: ScreenStreamer, touch: TouchClient):
    class PenHandler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            pass

        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path

            if path == "/" or path == "/index.html":
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(HTML_PAGE.encode("utf-8"))

            elif path == "/stream":
                self.send_response(200)
                self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
                self.end_headers()

                last_sent_count = -1
                try:
                    while streamer.running:
                        streamer.frame_event.wait(timeout=0.1)
                        streamer.frame_event.clear()
                        frame = streamer.get_latest_frame()
                        count = streamer.frame_count
                        if frame and count != last_sent_count:
                            last_sent_count = count
                            header = (
                                b"--frame\r\n"
                                b"Content-Type: image/jpeg\r\n"
                                b"Content-Length: " + str(len(frame)).encode() + b"\r\n\r\n"
                            )
                            self.wfile.write(header + frame + b"\r\n")
                            self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError):
                    pass

            elif path == "/api/status":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                status = {
                    "connected": streamer.is_connected,
                    "fps": streamer.fps,
                    "width": 960,
                    "height": 266,
                }
                self.wfile.write(json.dumps(status).encode())

            elif path == "/api/screenshot":
                frame = streamer.get_latest_frame()
                if frame:
                    self.send_response(200)
                    self.send_header("Content-Type", "image/jpeg")
                    self.send_header("Content-Disposition", 'attachment; filename="ydpen_screenshot.jpg"')
                    self.end_headers()
                    self.wfile.write(frame)
                else:
                    self.send_response(503)
                    self.end_headers()

            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/api/touch":
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len)
                try:
                    data = json.loads(body.decode("utf-8"))
                    ttype = data.get("type")
                    if ttype == "tap":
                        touch.tap(int(data["x"]), int(data["y"]))
                    elif ttype == "down":
                        touch.down(int(data["x"]), int(data["y"]))
                    elif ttype == "move":
                        touch.move(int(data["x"]), int(data["y"]))
                    elif ttype == "up":
                        touch.up()
                    elif ttype == "swipe":
                        touch.swipe(int(data["x1"]), int(data["y1"]), int(data["x2"]), int(data["y2"]), int(data.get("dur", 250)))
                    elif ttype == "key":
                        touch.key(str(data["key"]))
                    
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(b'{"status":"ok"}')
                except Exception as e:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(str(e).encode())
            else:
                self.send_response(404)
                self.end_headers()

    return PenHandler

# --------------------------------------------------------------------------- 主流程编排
def cleanup_device(dev_id: str | None = None):
    target = dev_id or CURRENT_DEVICE
    print("[CleanUp] 正在清理笔端后台进程与端口映射...")
    adb_run(["shell", "pkill -9 -f ffmpeg; pkill -9 -f ydpen_touch_server 2>/dev/null"], dev_id=target)
    adb_run(["forward", "--remove", f"tcp:{STREAM_PORT}"], dev_id=target)
    adb_run(["forward", "--remove", f"tcp:{TOUCH_PORT}"], dev_id=target)

def main():
    parser = argparse.ArgumentParser(description="有道词典笔远程投屏与控制工具")
    parser.add_argument("-s", "--serial", type=str, default=None, help="指定 ADB 设备序列号或 IP:PORT")
    parser.add_argument("--port", type=int, default=HTTP_PORT, help=f"Web UI 端口 (默认: {HTTP_PORT})")
    parser.add_argument("--no-browser", action="store_true", help="启动时不自动打开浏览器")
    parser.add_argument("--fps", type=int, default=15, help="捕获帧率 (默认: 15)")
    args = parser.parse_args()

    print("=========================================================")
    print("       🖊️ 有道词典笔电脑端远程投屏与控制系统")
    print("=========================================================")

    # 1. 检查 ADB 与设备
    try:
        dev_id = check_device(args.serial)
        global CURRENT_DEVICE
        CURRENT_DEVICE = dev_id
        print(f"[1/5] 已连接词典笔设备: {dev_id}")
    except RuntimeError as e:
        print(f"[错误] {e}")
        sys.exit(1)

    # 2. 检查并推送触控服务二进制
    if not os.path.isfile(TOUCH_SERVER_BIN):
        print(f"[错误] 找不到触控服务端文件: {TOUCH_SERVER_BIN}")
        sys.exit(1)
    
    print("[2/5] 部署触控服务到词典笔...")
    code, out = adb_run(["push", TOUCH_SERVER_BIN, REMOTE_TOUCH_BIN], dev_id=dev_id)
    if code != 0:
        print(f"[错误] 推送触控服务端失败: {out}")
        sys.exit(1)
    adb_run(["shell", f"chmod +x {REMOTE_TOUCH_BIN}"], dev_id=dev_id)

    # 3. 彻底重置笔端残留状态与唤醒屏幕
    print("[3/5] 初始化笔端运行环境...")
    adb_run(["shell", "pkill -9 -f ffmpeg; pkill -9 -f ydpen_touch_server 2>/dev/null"], dev_id=dev_id)
    adb_run(["shell", "echo 200 > /sys/class/backlight/backlight/brightness 2>/dev/null"], dev_id=dev_id)
    adb_run(["forward", "--remove", f"tcp:{STREAM_PORT}"], dev_id=dev_id)
    adb_run(["forward", "--remove", f"tcp:{TOUCH_PORT}"], dev_id=dev_id)
    time.sleep(0.3)

    # 建立端口转发
    adb_run(["forward", f"tcp:{STREAM_PORT}", f"tcp:{STREAM_PORT}"], dev_id=dev_id)
    adb_run(["forward", f"tcp:{TOUCH_PORT}", f"tcp:{TOUCH_PORT}"], dev_id=dev_id)

    # 控制变量
    stop_event = threading.Event()
    procs: list[subprocess.Popen] = []

    def start_pen_processes():
        # 启动自重启循环的 touch server
        touch_cmd = f"sh -c 'while true; do {REMOTE_TOUCH_BIN} {TOUCH_PORT}; sleep 0.3; done'"
        t_proc = subprocess.Popen(
            [ADB_CMD, "-s", dev_id, "shell", touch_cmd],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        procs.append(t_proc)

        # 启动自重启循环的 ffmpeg (transpose=1 输出正向 960x266 画面)
        ff_cmd = (
            f"sh -c 'while true; do "
            f"ffmpeg -nostdin -framerate {args.fps} -device /dev/dri/card0 -f kmsgrab -i - "
            f"-vf hwdownload,format=bgr0,crop=266:960:107:0,transpose=1 "
            f"-r {args.fps} -q:v 5 -f mjpeg \"tcp://127.0.0.1:{STREAM_PORT}?listen=1\"; "
            f"sleep 0.3; done'"
        )
        f_proc = subprocess.Popen(
            [ADB_CMD, "-s", dev_id, "shell", ff_cmd],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        procs.append(f_proc)

    start_pen_processes()

    # 4. 初始化本地触控与流捕获组件
    touch_client = TouchClient(TOUCH_PORT)
    touch_client.connect()

    screen_streamer = ScreenStreamer(STREAM_PORT)
    screen_streamer.start()

    # 5. 立即启动 Web UI 服务器
    handler_class = make_request_handler(screen_streamer, touch_client)
    server_address = ("127.0.0.1", args.port)
    try:
        httpd = ThreadedHTTPServer(server_address, handler_class)
    except OSError as e:
        print(f"[错误] 无法绑定端口 {args.port}: {e}")
        stop_event.set()
        cleanup_device()
        sys.exit(1)

    # 关键机制：将 HTTP 服务放入独立后台守护线程运行，彻底避免主线程 signal 导致 deadlock
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{args.port}"
    print(f"[4/5] Web 服务已就绪: {url}")
    print("[5/5] 系统启动完成！按 Ctrl+C 即可退出。")
    print("---------------------------------------------------------")

    if not args.no_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    # 安全极速退出清理函数
    def do_exit():
        if stop_event.is_set():
            return
        stop_event.set()
        print("\n正在停止服务并恢复设备状态...")
        screen_streamer.stop()
        touch_client.close()
        for p in procs:
            try:
                p.terminate()
            except Exception:
                pass
        cleanup_device()
        print("已安全退出。")

    def sig_handler(sig, frame):
        do_exit()
        sys.exit(0)

    signal.signal(signal.SIGINT, sig_handler)
    signal.signal(signal.SIGTERM, sig_handler)

    try:
        while not stop_event.is_set():
            time.sleep(0.3)
    except KeyboardInterrupt:
        do_exit()
        sys.exit(0)

if __name__ == "__main__":
    main()
