#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import subprocess
import time

ADB = "/opt/homebrew/bin/adb"
SRC_DIR = "/Volumes/500GB/小猪佩奇"
DST_DIR = "/userdisk/Favorite/Movies/小猪佩奇"

def get_remote_files():
    res = subprocess.run([ADB, "shell", f"ls -l '{DST_DIR}'"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    remote_map = {}
    for line in res.stdout.splitlines():
        parts = line.strip().split()
        if len(parts) >= 9:
            size_str = parts[4]
            name = " ".join(parts[8:]).strip("'\"")
            try:
                remote_map[name] = int(size_str)
            except ValueError:
                pass
    return remote_map

def push_file_with_retry(src_path, dst_path, max_retries=3):
    for attempt in range(1, max_retries + 1):
        cmd = [ADB, "push", src_path, dst_path]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0:
            return True, ""
        time.sleep(2)
        subprocess.run([ADB, "wait-for-device"])
    return False, res.stderr

def main():
    print("=== 同步 小猪佩奇 到词典笔 ===")
    subprocess.run([ADB, "shell", f"mkdir -p '{DST_DIR}'"], check=True)
    
    files = sorted([f for f in os.listdir(SRC_DIR) if f.startswith("小猪佩奇") and f.endswith(".mp4")])
    remote_files = get_remote_files()
    total = len(files)
    
    success_count = 0
    skip_count = 0
    start_time = time.time()
    
    for idx, fname in enumerate(files, 1):
        src_path = os.path.join(SRC_DIR, fname)
        local_size = os.path.getsize(src_path)
        
        if fname in remote_files and remote_files[fname] == local_size:
            print(f"[{idx}/{total}] 跳过已存在完整文件: {fname}")
            skip_count += 1
            success_count += 1
            continue
            
        t0 = time.time()
        print(f"[{idx}/{total}] 正在传输: {fname} ({local_size / 1024 / 1024:.1f} MB)...", flush=True)
        ok, err = push_file_with_retry(src_path, DST_DIR + "/")
        dur = time.time() - t0
        
        if ok:
            speed = (local_size / 1024 / 1024) / max(dur, 0.01)
            print(f"[{idx}/{total}] 完成 ({dur:.1f}s, {speed:.1f} MB/s)")
            success_count += 1
        else:
            print(f"[{idx}/{total}] 重试多次后依然失败: {err}")
            sys.exit(1)
            
    print(f"同步刷盘中...")
    subprocess.run([ADB, "shell", "sync"])
    
    total_time = time.time() - start_time
    print(f"\n全部传输完成！耗时: {total_time:.1f}s, 成功: {success_count}/{total} (跳过: {skip_count})")
    
    final_remote = get_remote_files()
    print(f"词典笔端文件数量校验: {len(final_remote)}/{total}")

if __name__ == "__main__":
    main()
