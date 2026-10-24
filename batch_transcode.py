#!/usr/bin/env python3
import os
import sys
import glob
import subprocess
import time

LOG_FILE = "/tmp/transcode.log"

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}\n"
    sys.stdout.write(line)
    sys.stdout.flush()
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)

def run_cmd(cmd):
    p = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return p.returncode, p.stdout, p.stderr

def main():
    log("=== 开始执行 480p H.264 转码与导入任务 ===")
    
    # 目标文件列表
    xcm_files = sorted(glob.glob("/Volumes/团队文件-Video/TV/熊出没/*.mp4"))[:3]
    rstv_files = sorted([f for f in glob.glob("/Volumes/团队文件-Video/RSTV/117/*") if f.endswith(".mp4") or f.endswith(".mov")])
    
    targets = []
    for f in xcm_files:
        targets.append(("熊出没", f))
    for f in rstv_files:
        targets.append(("117", f))
        
    log(f"共选定 {len(targets)} 个视频进行转码处理")
    
    temp_dir = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/transcode/output"
    os.makedirs(temp_dir, exist_ok=True)
    
    adb_target = "192.168.31.30:5555"
    
    for idx, (cat, src) in enumerate(targets, 1):
        base_name = os.path.basename(src)
        clean_name = os.path.splitext(base_name)[0]
        # 去掉空格以确保脚本处理兼容性
        clean_name = clean_name.replace(" ", "_")
        out_name = f"{clean_name}_480p.mp4"
        out_path = os.path.join(temp_dir, out_name)
        
        log(f"[{idx}/{len(targets)}] [{cat}] 正在转码: {base_name} -> {out_name}")
        
        # 使用 Apple VideoToolbox 硬件加速转码 480p H.264
        cmd = [
            "ffmpeg", "-y", "-i", src,
            "-vf", "scale=-2:480",
            "-c:v", "h264_videotoolbox", "-b:v", "1000k",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            out_path
        ]
        
        start_t = time.time()
        ret, out, err = run_cmd(" ".join(f'"{c}"' for c in cmd))
        cost_t = time.time() - start_t
        
        if ret != 0 or not os.path.exists(out_path):
            log(f"!! 转码失败: {base_name}, 错误: {err[-300:]}")
            continue
            
        out_size_mb = os.path.getsize(out_path) / (1024 * 1024)
        log(f"转码完成 (耗时 {cost_t:.1f}s, 大小 {out_size_mb:.1f} MB)，开始推送到词典笔...")
        
        # 推送到词典笔
        push_cmd = f'adb -s {adb_target} push "{out_path}" "/userdisk/Favorite/Movies/{out_name}"'
        push_ret, push_out, push_err = run_cmd(push_cmd)
        
        if push_ret == 0:
            log(f"成功推送至词典笔: /userdisk/Favorite/Movies/{out_name}")
            # 触发词典笔扫描更新
            run_cmd(f'adb -s {adb_target} shell "/userdisk/scan-movies" 2>/dev/null')
            # 成功推送后清理本地文件
            if os.path.exists(out_path):
                os.remove(out_path)
        else:
            log(f"!! 推送失败 (设备暂离线，本地保留以便稍后导入): {push_err}")
            
    log("=== 所有 480p 转码与推送任务已全部结束 ===")

if __name__ == "__main__":
    main()
