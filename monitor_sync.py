#!/usr/bin/env python3
import os
import sys
import glob
import time
import subprocess

ADB_SN = "9DA2200007506350"
OUTPUT_DIR = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/transcode/output"
LOG_FILE = "/tmp/transcode.log"

def run_cmd(cmd):
    p = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return p.returncode, p.stdout.strip(), p.stderr.strip()

def get_target_files():
    xcm_files = sorted(glob.glob("/Volumes/团队文件-Video/TV/熊出没/*.mp4"))[:3]
    rstv_files = sorted([f for f in glob.glob("/Volumes/团队文件-Video/RSTV/117/*") if f.endswith(".mp4") or f.endswith(".mov")])
    targets = []
    for f in xcm_files:
        base = os.path.basename(f)
        clean = os.path.splitext(base)[0].replace(" ", "_") + "_480p.mp4"
        targets.append(("熊出没", f, clean))
    for f in rstv_files:
        base = os.path.basename(f)
        clean = os.path.splitext(base)[0].replace(" ", "_") + "_480p.mp4"
        targets.append(("117", f, clean))
    return targets

def transcode_and_push(cat, src, out_name):
    out_path = os.path.join(OUTPUT_DIR, out_name)
    print(f"[*] 正在补充转码: {out_name}...")
    cmd = [
        "ffmpeg", "-y", "-i", src,
        "-vf", "scale=-2:480",
        "-c:v", "h264_videotoolbox", "-b:v", "1000k",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        out_path
    ]
    start_t = time.time()
    ret, _, err = run_cmd(" ".join(f'"{c}"' for c in cmd))
    cost_t = time.time() - start_t
    if ret != 0 or not os.path.exists(out_path):
        print(f"[!] 补充转码失败: {out_name}, 错误: {err[-200:]}")
        return False
    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"[*] 补充转码成功: {out_name} ({size_mb:.1f} MB, {cost_t:.1f}s)，开始通过 USB 推送...")
    return push_file(out_path, out_name)

def push_file(local_path, out_name):
    remote_path = f"/userdisk/Favorite/Movies/{out_name}"
    print(f"[*] 正在推送到设备: {remote_path}...")
    push_cmd = f'adb -s {ADB_SN} push "{local_path}" "{remote_path}"'
    ret, out, err = run_cmd(push_cmd)
    if ret == 0:
        print(f"[+] 推送成功: {out_name}")
        if os.path.exists(local_path):
            os.remove(local_path)
        return True
    else:
        print(f"[!] 推送失败: {out_name}, 错误: {err}")
        return False

def check_device_files():
    cmd = f'adb -s {ADB_SN} shell ls -1 /userdisk/Favorite/Movies/'
    ret, out, _ = run_cmd(cmd)
    if ret == 0:
        return set(line.strip() for line in out.splitlines() if line.strip())
    return set()

def main():
    print("[*] 启动监控与同步任务，目标设备:", ADB_SN)
    targets = get_target_files()
    print(f"[*] 共目标视频 {len(targets)} 个")

    # 1. 监控 batch_transcode.py 运行直到结束
    last_pos = 0
    if os.path.exists(LOG_FILE):
        last_pos = os.path.getsize(LOG_FILE)

    while True:
        # 查看是否还有 batch_transcode.py 在运行
        ret, out, _ = run_cmd("pgrep -f batch_transcode.py")
        is_running = (ret == 0 and bool(out))

        # 读取新日志
        if os.path.exists(LOG_FILE):
            curr_size = os.path.getsize(LOG_FILE)
            if curr_size > last_pos:
                with open(LOG_FILE, "r", encoding="utf-8", errors="ignore") as f:
                    f.seek(last_pos)
                    new_logs = f.read()
                    last_pos = curr_size
                    for line in new_logs.splitlines():
                        if line.strip():
                            print(f"[batch_transcode] {line.strip()}")

        if not is_running:
            print("[*] batch_transcode.py 进程已退出，开始检查最终状态与文件完整性...")
            break

        time.sleep(10)

    # 2. 检查词典笔上的文件
    device_files = check_device_files()
    print(f"[*] 词典笔上现有文件数量: {len(device_files)}")

    missing = []
    for cat, src, out_name in targets:
        if out_name not in device_files:
            missing.append((cat, src, out_name))

    if missing:
        print(f"[!] 发现缺失文件 {len(missing)} 个: {[m[2] for m in missing]}")
        for cat, src, out_name in missing:
            local_path = os.path.join(OUTPUT_DIR, out_name)
            if os.path.exists(local_path):
                print(f"[*] 本地 output 发现未推送文件: {out_name}，执行 USB 推送...")
                push_file(local_path, out_name)
            else:
                print(f"[*] 本地无缓存，开始补充转码并推送: {out_name}...")
                transcode_and_push(cat, src, out_name)
    else:
        print("[+] 恭喜！所有 14 个目标视频均已成功导入词典笔！")

    # 3. 再次检查缺失
    device_files = check_device_files()
    final_missing = [t[2] for t in targets if t[2] not in device_files]
    if final_missing:
        print(f"[!] 仍然缺失以下文件: {final_missing}")
    else:
        print("[+] 再次确认：全部 14 个视频文件全部存在于词典笔！")

    # 4. 刷新媒体库
    print("[*] 执行 /userdisk/scan-movies 刷新媒体库...")
    ret, scan_out, scan_err = run_cmd(f'adb -s {ADB_SN} shell /userdisk/scan-movies')
    print(f"[*] 扫描输出:\n{scan_out}")

    # 5. 列出所有 14 个文件的详细列表与大小
    print("\n[*] === 词典笔 /userdisk/Favorite/Movies/ 目录详情 ===")
    ret, ls_out, _ = run_cmd(f'adb -s {ADB_SN} shell ls -lh /userdisk/Favorite/Movies/')
    print(ls_out)

if __name__ == "__main__":
    main()
