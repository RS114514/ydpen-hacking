import datetime
import json
import os
import re
import socket
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAC_IP = "192.168.31.170"
UPSTREAM_DNS = ("223.5.5.5", 53)
TARGET_HOST = "iotapi.abupdate.com"
FW_PATH = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/firmware/d5c214b2-7a1a-4317-a457-9bc7e186a81a.img"
RESP_PATH = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/ydpen-toolkit/out/patched_response.json"
CHUNK_SIZE = 512 * 1024

def now():
    return datetime.datetime.now().strftime("%H:%M:%S")

def log(msg):
    print(f"[{now()}] {msg}", flush=True)

# ----------------- 1. DNS Server (Port 53) -----------------
def parse_domain(data):
    try:
        parts = []
        i = 12
        while i < len(data):
            length = data[i]
            if length == 0:
                break
            i += 1
            parts.append(data[i:i+length].decode("ascii", "ignore"))
            i += length
        return ".".join(parts).lower()
    except Exception:
        return ""

def build_dns_response(data, ip_str):
    tid = data[:2]
    flags = b"\x81\x80"
    qdcount = data[4:6]
    ancount = b"\x00\x01"
    nscount = b"\x00\x00"
    arcount = b"\x00\x00"
    header = tid + flags + qdcount + ancount + nscount + arcount
    
    i = 12
    while i < len(data) and data[i] != 0:
        i += data[i] + 1
    i += 5
    question = data[12:i]
    answer = b"\xc0\x0c" + b"\x00\x01" + b"\x00\x01" + b"\x00\x00\x00\x1e" + b"\x00\x04" + socket.inet_aton(ip_str)
    return header + question + answer

def run_dns():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 53))
    log(f"DNS 劫持服务器已启动 (UDP 53) -> {TARGET_HOST} -> {MAC_IP}")
    while True:
        try:
            data, addr = sock.recvfrom(2048)
            domain = parse_domain(data)
            if TARGET_HOST in domain:
                log(f"[DNS 命中] 来自 {addr[0]} 查询 {domain} -> 返回 {MAC_IP}")
                sock.sendto(build_dns_response(data, MAC_IP), addr)
            else:
                up_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                up_sock.settimeout(2.0)
                try:
                    up_sock.sendto(data, UPSTREAM_DNS)
                    resp, _ = up_sock.recvfrom(2048)
                    sock.sendto(resp, addr)
                except Exception:
                    pass
                finally:
                    up_sock.close()
        except Exception as e:
            log(f"DNS 异常: {e}")

# ----------------- 2. Fake OTA Server (Port 80) -----------------
class OTAHandler(BaseHTTPRequestHandler):
    server_version = "nginx/1.20.1"

    def log_message(self, fmt, *args):
        pass

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length > 0 else b""
        peer = self.client_address[0]
        log(f"[OTA 请求] POST {self.path} 来自 {peer}")
        try:
            with open(RESP_PATH, "r", encoding="utf-8") as f:
                resp_json = json.load(f)
            resp_bytes = json.dumps(resp_json, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json;charset=UTF-8")
            self.send_header("Content-Length", str(len(resp_bytes)))
            self.send_header("Server", "nginx/1.20.1")
            self.end_headers()
            self.wfile.write(resp_bytes)
            log(f"    -> 已向 {peer} 发送版本 99.99.91 响应")
        except Exception as e:
            log(f"    OTA 应答异常: {e}")
            self.send_response(500)
            self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OTA server ready")

def run_ota():
    server = ThreadingHTTPServer(("0.0.0.0", 80), OTAHandler)
    log("OTA 伪造服务器已启动 (TCP 80)")
    server.serve_forever()

# ----------------- 3. File Server (Port 14514) -----------------
class FileHandler(BaseHTTPRequestHandler):
    server_version = "nginx/1.20.1"

    def log_message(self, fmt, *args):
        pass

    def do_GET(self):
        size = os.path.getsize(FW_PATH)
        name = os.path.basename(FW_PATH)
        rng = self.headers.get("Range")
        start, end = 0, size - 1
        partial = False
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)", rng.strip())
            if m:
                s, e = m.group(1), m.group(2)
                if s:
                    start = int(s)
                    end = int(e) if e else size - 1
                elif e:
                    start = max(0, size - int(e))
                partial = True
        end = min(end, size - 1)
        length = end - start + 1
        peer = self.client_address[0]
        log(f"[固件下载] 来自 {peer} Range={rng or '全部'} -> 发送 {length/1048576:.1f} MB (从 {start/1048576:.1f} MB 开始)")
        
        self.send_response(206 if partial else 200)
        self.send_header("Content-Type", "application/octet-stream")
        self.send_header("Content-Disposition", f'attachment; filename="{name}"')
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(length))
        if partial:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Connection", "close")
        self.end_headers()

        sent = 0
        last_log = start
        try:
            with open(FW_PATH, "rb") as f:
                f.seek(start)
                remain = length
                while remain > 0:
                    buf = f.read(min(CHUNK_SIZE, remain))
                    if not buf:
                        break
                    self.wfile.write(buf)
                    remain -= len(buf)
                    sent += len(buf)
                    if (start + sent) - last_log >= 100 * 1024 * 1024:
                        last_log = start + sent
                        log(f"    下载进度: {(start+sent)/1048576:.1f} MB / {size/1048576:.1f} MB ({((start+sent)/size)*100:.1f}%)")
            log(f"    当前分段传输结束 (已发 {sent/1048576:.1f} MB)")
        except (ConnectionResetError, BrokenPipeError):
            log(f"    客户端连接中断（设备换块重连属于正常机制）")

def run_file():
    server = ThreadingHTTPServer(("0.0.0.0", 14514), FileHandler)
    log("固件直链服务器已启动 (TCP 14514)")
    server.serve_forever()

if __name__ == "__main__":
    t_dns = threading.Thread(target=run_dns, daemon=True)
    t_ota = threading.Thread(target=run_ota, daemon=True)
    t_file = threading.Thread(target=run_file, daemon=True)
    t_dns.start()
    t_ota.start()
    t_file.start()
    log("=== 三合一服务全部运行中 ===")
    t_dns.join()
