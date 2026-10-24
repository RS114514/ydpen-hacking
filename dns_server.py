import socket
import datetime
import subprocess

TARGET_HOST = "iotapi.abupdate.com"
UPSTREAM_DNS = ("223.5.5.5", 53)

def now():
    return datetime.datetime.now().strftime("%H:%M:%S")

def get_local_ips():
    ips = {}
    try:
        out = subprocess.check_output(["ifconfig"], text=True)
        for line in out.splitlines():
            line = line.strip()
            if line.startswith("inet ") and not line.startswith("inet 127.") and not "198.18." in line:
                parts = line.split()
                ip = parts[1]
                subnet = ".".join(ip.split(".")[:3])
                ips[subnet] = ip
    except Exception:
        pass
    return ips

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
    
    answer = b"\xc0\x0c" + b"\x00\x01" + b"\x00\x01" + b"\x00\x00\x00\x3c" + b"\x00\x04" + socket.inet_aton(ip_str)
    return header + question + answer

def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 53))
    print(f"[{now()}] DNS Hijack Server running on 0.0.0.0:53 (target: {TARGET_HOST})", flush=True)
    
    while True:
        try:
            data, addr = sock.recvfrom(2048)
            domain = parse_domain(data)
            client_ip = addr[0]
            if TARGET_HOST in domain:
                subnets = get_local_ips()
                client_subnet = ".".join(client_ip.split(".")[:3])
                reply_ip = subnets.get(client_subnet, subnets.get("192.168.31", "192.168.31.170"))
                print(f"[{now()}] [!] Hijacked query for {domain} from {client_ip} -> {reply_ip}", flush=True)
                resp = build_dns_response(data, reply_ip)
                sock.sendto(resp, addr)
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
            print(f"[{now()}] [x] Error: {e}", flush=True)

if __name__ == "__main__":
    main()
