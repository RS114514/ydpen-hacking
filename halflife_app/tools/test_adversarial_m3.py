#!/usr/bin/env python3
"""Challenger M3 Adversarial Empirical Verification Suite.

Target device: 9DA2200007506350 (Youdao Dictionary Pen 6)
Focus areas:
1. Rapid restart / quicksave & quickload integrity stress test
2. SIGKILL crash & heartbeat auto-heal stress test
3. Forensic audit of test_e2e_verification assertions and runtime states
"""

import os
import re
import socket
import struct
import subprocess
import sys
import time

SERIAL = "9DA2200007506350"
XRCON_PORT = 27000
XRCON_MAGIC = b'CMND\x00\x00\x00\xd4'


def adb_shell(cmd):
    wrapped = f"{cmd}; code=$?; printf \"\\n__HL_EXIT__%s\\n\" \"$code\""
    res = subprocess.run(
        ["adb", "-s", SERIAL, "shell", wrapped],
        capture_output=True, text=True, timeout=15
    )
    out = res.stdout
    m = re.search(r"__HL_EXIT__(\d+)\s*$", out)
    code = int(m.group(1)) if m else 1
    cleaned = out[:m.start()].strip() if m else out.strip()
    return code, cleaned


def send_xrcon(cmd_str, timeout=2.0):
    payload = cmd_str.encode("latin1")
    frame = XRCON_MAGIC + struct.pack("!HH", 12 + len(payload), 0) + payload
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect(("127.0.0.1", XRCON_PORT))
        try:
            sock.settimeout(0.3)
            sock.recv(1024)
        except Exception:
            pass
        sock.settimeout(timeout)
        sock.sendall(frame)
        sock.shutdown(socket.SHUT_WR)
        resp = b""
        while True:
            try:
                chunk = sock.recv(1024)
                if not chunk:
                    break
                resp += chunk
            except Exception:
                break
        sock.close()
        return True, resp.decode("latin1", errors="replace")
    except Exception as e:
        sock.close()
        return False, str(e)


def setup_port():
    subprocess.run(["adb", "-s", SERIAL, "forward", f"tcp:{XRCON_PORT}", f"tcp:{XRCON_PORT}"], capture_output=True)


def remove_port():
    subprocess.run(["adb", "-s", SERIAL, "forward", "--remove", f"tcp:{XRCON_PORT}"], capture_output=True)


def test_adversarial_crash_and_heartbeat():
    print("=== 对抗性测试 1: 底层 xash3d 进程强杀与心跳自愈实测 ===")
    results = []
    miniapp_code, miniapp_pid = adb_shell("pidof miniapp")
    print(f"[*] miniapp 主进程 PID: {miniapp_pid}")

    for cycle in range(1, 4):
        code, old_pid = adb_shell("pidof xash3d")
        old_pid = old_pid.strip()
        print(f"[*] Cycle {cycle}: 当前 xash3d PID: {old_pid}")
        if not old_pid:
            results.append({"cycle": cycle, "status": "FAIL", "reason": "xash3d 未运行"})
            continue

        # 发送 SIGKILL
        t0 = time.time()
        adb_shell(f"kill -9 {old_pid}")

        # 检测自愈重拉起
        new_pid = None
        deadline = time.time() + 6.0
        while time.time() < deadline:
            c, p = adb_shell("pidof xash3d")
            p = p.strip()
            if p and p != old_pid:
                new_pid = p
                break
            time.sleep(0.15)

        elapsed = time.time() - t0
        if new_pid:
            c, ppid = adb_shell(f"cat /proc/{new_pid}/status | grep PPid")
            ppid_val = ppid.split()[-1] if ppid else ""
            print(f"    -> 自愈拉起成功: 新 PID={new_pid}, PPID={ppid_val}, 耗时={elapsed:.2f}s")
            matches = (ppid_val == miniapp_pid)
            results.append({
                "cycle": cycle,
                "status": "PASS" if matches else "FAIL",
                "old_pid": old_pid,
                "new_pid": new_pid,
                "ppid": ppid_val,
                "elapsed": elapsed,
                "parent_match": matches
            })
        else:
            print(f"    -> 自愈超时失败 (超时 6s 未重新拉起)")
            results.append({"cycle": cycle, "status": "FAIL", "reason": "Heartbeat timeout"})

        time.sleep(1.0)

    pass_count = sum(1 for r in results if r["status"] == "PASS")
    print(f"[*] 心跳自愈通过率: {pass_count}/{len(results)}\n")
    return results


def test_adversarial_quicksave_integrity():
    print("=== 对抗性测试 2: 真实运行时 save quick 与 quick.sav 更新实测 ===")
    setup_port()
    time.sleep(0.5)

    code, before_stat = adb_shell("stat -c '%y|%s' /userdisk/halflife/valve/save/quick.sav 2>/dev/null")
    print(f"[*] 存盘前 quick.sav 状态: {before_stat.strip() or '不存在'}")

    ok, resp = send_xrcon("save quick")
    print(f"[*] XRCON 下发 save quick 指令回执: ok={ok}, resp={repr(resp)}")
    time.sleep(2.0)

    code, after_stat = adb_shell("stat -c '%y|%s' /userdisk/halflife/valve/save/quick.sav 2>/dev/null")
    print(f"[*] 存盘后 quick.sav 状态: {after_stat.strip() or '不存在'}")

    updated = (before_stat != after_stat) and (after_stat.strip() != "")
    print(f"[*] 判定结果: quick.sav 是否真实产生更新: {updated}")

    # 读取当前引擎 cl.state 状态
    code, pid = adb_shell("pidof xash3d")
    pid = pid.strip()
    cl_state = "UNKNOWN"
    if pid:
        code, maps = adb_shell(f"cat /proc/{pid}/maps | grep libxash.so | head -n 1")
        if maps:
            base = int(maps.split("-")[0], 16)
            addr = base + 0x874000 + 0x750
            code, mem_res = adb_shell(f"dd if=/proc/{pid}/mem bs=1 skip={addr} count=4 2>/dev/null | hexdump -C")
            parts = mem_res.split()
            if len(parts) >= 5:
                b = bytes([int(x, 16) for x in parts[1:5]])
                cl_state = str(struct.unpack("<I", b)[0])
    print(f"[*] 底层引擎内部运行态 cl.state: {cl_state} (4 为 ca_active, 0 为未激活/菜单)")

    remove_port()
    print()
    return {
        "updated": updated,
        "before": before_stat.strip(),
        "after": after_stat.strip(),
        "cl_state": cl_state
    }


def test_adversarial_return_key_mechanism():
    print("=== 对抗性测试 3: 实体返回键注入与 /bin/input 实现审计 ===")
    code, input_content = adb_shell("cat /bin/input")
    has_keyevent = "keyevent" in input_content
    print(f"[*] /bin/input 是否支持 keyevent: {has_keyevent}")
    if not has_keyevent:
        print("    -> 发现漏洞: /bin/input 脚本仅分流 tap 与 swipe，对 keyevent 静默忽略退出0")
        print("    -> 测试用例 TC-E2E-T1-02-04 依赖 `input keyevent 4` 属于虚假测试！")
    print()
    return {"has_keyevent": has_keyevent}


def main():
    print("=" * 70)
    print(" Challenger M3: 生命周期存续与异常自愈对抗性实测")
    print(" 设备: 9DA2200007506350 (YDPX6-2)")
    print("=" * 70 + "\n")

    r1 = test_adversarial_crash_and_heartbeat()
    r2 = test_adversarial_quicksave_integrity()
    r3 = test_adversarial_return_key_mechanism()

    print("=" * 70)
    print(" 总结裁决")
    print("=" * 70)
    print(f"1. 进程级异常强杀心跳自愈: {'PASS' if all(x['status'] == 'PASS' for x in r1) else 'FAIL'}")
    print(f"2. 游戏存读档真实更新与持久化: {'PASS' if r2['updated'] else 'FAIL (阻塞缺陷)'}")
    print(f"3. 物理返回键测试有效性: {'PASS' if r3['has_keyevent'] else 'FAIL (虚假测试)'}")
    print(f"4. 引擎核心激活态 (cl.state): {r2['cl_state']} (期望 4)")

    failed = not r2["updated"] or not r3["has_keyevent"] or (r2["cl_state"] != "4")
    verdict = "REQUEST_CHANGES" if failed else "APPROVE"
    print(f"\n>>> 终审裁决: {verdict} <<<\n")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
