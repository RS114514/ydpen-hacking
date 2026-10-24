#!/usr/bin/env python3
import os
import sys
import time
import subprocess

OUTPUT_DIR = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/transcode/output"
LOG_FILE = "/tmp/local_transcode.log"

TARGETS = [
    ("/Volumes/团队文件-Video/RSTV/117/16_monsters和你爱错 1.mp4", "16_monsters和你爱错_1_480p.mp4"),
    ("/Volumes/团队文件-Video/RSTV/117/17_黛玉 1.mp4", "17_黛玉_1_480p.mp4"),
    ("/Volumes/团队文件-Video/RSTV/117/18_红日 1.mp4", "18_红日_1_480p.mp4"),
    ("/Volumes/团队文件-Video/RSTV/117/20_去远方.mp4", "20_去远方_480p.mp4"),
    ("/Volumes/团队文件-Video/RSTV/117/21_奔跑 1.mp4", "21_奔跑_1_480p.mp4"),
]

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}\n"
    sys.stdout.write(line)
    sys.stdout.flush()
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)

def run_cmd(cmd):
    p = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return p.returncode, p.stdout.strip(), p.stderr.strip()

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    log("=== 开始执行 Mac 本地 480p H.264 转码任务 (纯本地，无任何 ADB 操作) ===")
    log(f"待转码文件共 {len(TARGETS)} 个，输出目录: {OUTPUT_DIR}")

    total_start = time.time()
    results = []

    for idx, (src, out_name) in enumerate(TARGETS, 1):
        out_path = os.path.join(OUTPUT_DIR, out_name)
        log(f"[{idx}/{len(TARGETS)}] 开始转码: {os.path.basename(src)} -> {out_name}")

        cmd = [
            "ffmpeg", "-y", "-i", src,
            "-vf", "scale=-2:480",
            "-c:v", "h264_videotoolbox", "-b:v", "1000k",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            out_path
        ]

        t0 = time.time()
        ret, out, err = run_cmd(" ".join(f'"{c}"' for c in cmd))
        cost = time.time() - t0

        if ret != 0 or not os.path.exists(out_path):
            log(f"!! 转码失败: {out_name}, 错误: {err[-300:]}")
            results.append((out_name, False, 0, cost))
            continue

        size_mb = os.path.getsize(out_path) / (1024 * 1024)
        # 使用 ffprobe 验证完整性
        chk_ret, chk_out, _ = run_cmd(f'ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "{out_path}"')
        if chk_ret == 0:
            log(f"转码成功并通过校验: {out_name} ({size_mb:.1f} MB, 耗时 {cost:.1f}s)")
            results.append((out_name, True, size_mb, cost))
        else:
            log(f"!! 文件完整性校验未通过: {out_name}")
            results.append((out_name, False, size_mb, cost))

    total_cost = time.time() - total_start
    log(f"=== 本地转码全部结束，总耗时 {total_cost:.1f}s ===")
    for name, ok, sz, cst in results:
        status = "成功" if ok else "失败"
        log(f"- {name}: {status} ({sz:.1f} MB, {cst:.1f}s)")

if __name__ == "__main__":
    main()
