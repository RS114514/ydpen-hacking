# 三代词典笔（有道 X6 Pro）系统镜像 + Docker 虚拟环境

导出时间：2026-11-17 23:57 ~ 00:30
设备：`YoudaoDictionaryPen-234`（ADB 序列号 `2C11200001902234`）
固件：`Firmware / DictPen_APP 3.4.5`，Build_Time `2025-12-10 20:55:28`
平台：Rockchip RK3566（Cortex-A55 ×4，aarch64），内核 `4.19.161`，Root 权限可用
系统：Buildroot 2018.02 打包的嵌入式 Linux（非 Android），glibc 2.29 + Qt + weston 8.0.0

## 一、目录内容

| 文件 | 大小 | 说明 |
|---|---|---|
| `system_a.img` | 1.25 GiB | 系统分区（mmcblk1p9）原始镜像，当前启动槽，ext4，`ro` 挂载为 `/` |
| `boot_a.img` | 16 MiB | 内核 + dtb（mmcblk1p6） |
| `recovery.img` | 64 MiB | recovery 分区（mmcblk1p8） |
| `rootfs.tar.gz` | 593 MiB | 根文件系统打包（剔除 proc/sys/dev/tmp/run/var 与各独立分区），用于 Docker |
| `device_info.txt` | — | 导出时的 uname / 分区表 / mounts / df / fstab / 根目录清单 |
| `SHA256SUMS.txt` | — | 上述镜像的 SHA256 |
| `docker/` | — | 虚拟环境构建脚本与依赖 |

校验值（与笔上 `md5sum` 比对一致）：

```
system_a.img  md5 a3e1d4486295885e77c5aea245e9d590
```

## 二、分区布局（15.1 GB eMMC，A/B 双槽）

| 区块 | 名称 | 大小 |
|---|---|---|
| mmcblk1p1 / p2 | uboot_a / uboot_b | 4 MiB ×2 |
| mmcblk1p3 / p4 | trust_a / trust_b | 4 MiB ×2 |
| mmcblk1p5 | misc | 4 MiB |
| mmcblk1p6 / p7 | boot_a / boot_b | 16 MiB ×2 |
| mmcblk1p8 | recovery | 64 MiB |
| mmcblk1p9 / p10 | system_a / system_b | 1.25 GiB ×2 |
| mmcblk1p11 | uresource | 4 GiB（资源，已用 3.3 GiB，**未导出**） |
| mmcblk1p12 | userdata | 256 MiB（ext2，`/userdata`） |
| mmcblk1p13 | swap | 1 GiB |
| mmcblk1p14 | userdisk | 6.5 GiB（ext4，`/userdisk`，应用都装这里） |

未导出 `uresource` 与 `userdisk`：前者 4 GiB 资源包、后者是你的应用数据，都不是"系统镜像"本体，
且当时笔上只剩 2.7 GiB 空闲。需要时可直接 `adb pull` 单个文件，不必整分区 dd。

## 三、导出时的两个坑（下次照抄）

1. `adb exec-out` 在这台笔上直接 `error: closed`，二进制流拉不下来。改成**先在笔上 dd 到 `/userdisk`，再 `adb pull`**。
2. 笔上空间紧张，导出后立刻删：本次用完已 `rm -rf /userdisk/__export`，`/userdisk` 占用从 3.6 G 回到 1.7 G。

```sh
adb shell 'mkdir -p /userdisk/__export && dd if=/dev/block/by-name/system_a of=/userdisk/__export/system_a.img bs=4M'
adb pull /userdisk/__export/system_a.img ./system_a.img
adb shell 'rm -rf /userdisk/__export'      # 别忘
```

`adb pull` 实测只有 7.5 MB/s 左右，1.25 GiB 要接近 3 分钟，别中途掐断（断掉会留下 0 字节文件）。

## 四、Docker 虚拟环境（不用连笔）

镜像已构建好：`ydpen-dict3:env-v3.4.5`（linux/arm64，原生跑在 M2 上，不需要 qemu）。

```sh
# 一次性：从导出的 rootfs 生成基础镜像
docker import rootfs.tar.gz ydpen-dict3:3.4.5

# 之后每次改 Dockerfile 重建
./docker/build.sh

# 进环境（自动拉起无头 weston，输出 960x480 横屏）
./docker/penenv.sh

# 跑一条命令 / 跑笔上的程序
./docker/penenv.sh -c "cat /Version; ls /usr/lib | wc -l"
PEN_COMPOSITOR=0 ./docker/penenv.sh -c "你的单元测试"     # 纯命令行不必起合成器
./docker/smoke-test.sh                                   # 冒烟测试
```

工作区 `/Volumes/500GB/Ydpen` 挂在容器里的 `/userdisk`，和笔上的路径一致，所以
`/userdisk/doom_port/...` 这类脚本里的绝对路径不用改。

### 环境里有什么

- 笔的完整用户态：`/bin` 499 个程序、`/usr/lib` 590 个库、Qt、weston 8.0.0、ffmpeg 4.1.3
- 无头显示：笔上 weston 只编了 drm/wayland 后端，从 Debian bullseye 的 weston 8.0.0 里补了
  `headless-backend.so` / `fbdev-backend.so`（`docker/weston-mods/`），再由 `entrypoint.sh` 起
  `weston --backend=headless-backend.so`
- `docker/extra-libs/`：从笔上 `/userdisk/doom` 抠出来的 `libffi.so.8`、`libwayland-client.so.0`，
  部分移植版（如 doom）需要新版 libwayland，系统里只有 0.17 版

### 验证结果

`doom_port` 的 `doom_ydpen`（aarch64 ELF，interpreter `/lib/ld-linux-aarch64.so.1`）在容器里跑窗口模式：

```
[doom] doomgeneric Youdao X6 Pro Wayland port
[wl] toplevel configure 0x0 states:
[wl] surface configured serial=2
[wl] layout=window output=960x480 visible_y=107
[doom] DG_Init done: layout=window output=960x480 ui_y=107 touch_fd=-1 audio=1
```

即完成了 wayland 连接、创建上层窗口、拿到 configure、进入主循环，weston 全程存活。

合成器侧的场景图（`weston-debug scene-graph`）也能看到这个窗口被真正接管：

```
View 0 (role xdg_toplevel, PID 17, surface ID 3,
        top-level window 'DOOM - Youdao X6 Pro' of com.rs114514.doom):
```

协议层同样对得上（`WAYLAND_DEBUG=1`）：

```
-> xdg_wm_base.get_xdg_surface -> xdg_surface.get_toplevel
-> xdg_toplevel.set_title("DOOM - Youdao X6 Pro")
-> xdg_toplevel.set_app_id("com.rs114514.doom")
-> xdg_toplevel.set_min_size(960, 266)
-> wl_surface.commit()
xdg_toplevel.configure(0, 0, array[0])
xdg_surface.configure(2) -> ack_configure(2)
```

`./docker/smoke-test.sh` 每次跑完会把上面这些证据落到 `docker/artifacts/`：

| 文件 | 内容 |
|---|---|
| `summary.txt` | 一页看完：程序关键输出 + 场景图节选 |
| `doom.log` | 程序完整日志 |
| `weston.log` | 合成器日志 |
| `scene-graph.txt` | 程序运行中的场景图（含 toplevel 视图） |
| `wayland-trace.txt` | toplevel / configure / commit 协议轨迹 |

> 注：本环境里 `weston-screenshooter` 绑上了 `weston_screenshooter` 全局，
> 但发不出 take_screenshot（weston 8 headless 的已知问题），所以**没有 PNG 截图**，
> 改用场景图 + 协议轨迹作为"窗口真的建起来了"的客观证据。像素级回归只能回真机看。

## 五、已知限制

- **全屏会崩合成器**：`xdg_toplevel.set_fullscreen(nil)` 打到 headless weston 上会让 desktop-shell 挂掉
  （客户端表现为 `configure wait failed: Broken pipe`）。测试时用窗口模式，例如 `DOOM_LAYOUT=window`；
  需要全屏的 UI 回归还是得回真机。
- **没有 GPU**：`/dev/mali0` 不存在，`weston-simple-egl` 会 assert 失败；纯 EGL/GLES 渲染的路径跑不了，
  shm 软件渲染（多数移植版用的）正常。
- **没有声卡 / 触摸**：ALSA 报 "Invalid value for card"、`/dev/input/event*` 不存在，属预期。
  `weston-screenshooter` 需要 `--debug` 且在本环境中未能出图，截屏建议改用应用自绘日志。
- **`uresource` 未导出**：依赖 `/uresource` 下字体、音效、模型的应用，在容器里会缺资源，需要单独补。
- **别把镜像写回笔上做实验**：`system_a.img` 是救援用的底本，真要刷回务必先确认槽位和 `misc`，
  写错会变砖（好在有 `boot_a`/`recovery`，理论上可救）。

## 六、回到笔上之后（放学后照这个顺序做）

笔一插上、`adb devices` 能看到 `2C11200001902234` 后：

```sh
# 1) 先确认笔是"连续运行"没重启过，且上次导出的临时目录已经清干净
adb shell 'cat /proc/uptime; ls /userdisk/__export 2>&1; df -h /userdisk | tail -1'

# 2) 三份镜像再和笔对一次（只读，不改任何数据）
adb shell 'md5sum /dev/block/by-name/system_a 2>/dev/null || md5sum /dev/block/mmcblk1p9'
#    期望：a3e1d4486295885e77c5aea245e9d590

# 3) 本地四份文件的 SHA256 再校一遍
cd "/Volumes/500GB/Ydpen/三代笔" && shasum -a 256 -c SHA256SUMS.txt

# 4) 虚拟环境随时可用，不依赖笔
cd docker && ./smoke-test.sh
```

如果第 1 步发现 `/userdisk/__export` 还在（导出中途被打断），直接清掉：
`adb shell 'rm -rf /userdisk/__export'`。

### 装游戏（BVN 移植）时的顺序

镜像导出和虚拟环境都是"底本"，真正的安装只在 `/userdisk` 里做，**不碰 system_a / uresource**：

1. `adb push` 游戏目录到 `/userdisk/bvn36`（含 `bin/`、`assetss/`、启动脚本）
2. `adb shell 'chmod +x /userdisk/bvn36/bin/* /userdisk/bvn36/run.sh'`
3. 用 miniapp 图标启动（`term.execSync` 拉起 `run.sh`），或先手动跑：
   `adb shell 'setsid /userdisk/bvn36/run.sh >/dev/null 2>&1 </dev/null &'`
4. 验收看截图：`curl -X POST http://127.0.0.1:18088/api/screenshot -d '{}' -o shot.jpg`
5. 卸掉就只删 `/userdisk/bvn36`，不动系统分区

## 七、变更记录

- 2026-11-17 23:57 ~ 00:30：首次导出 system_a / boot_a / recovery + rootfs，`system_a.img`
  的 md5 与笔上一致（`a3e1d448…e9d590`）。
- 2026-11-18 06:10：重建 `ydpen-dict3:env-v3.4.5`（上一轮镜像被清掉了），
  修好 `penenv.sh -c "..."`（原来会报 `illegal option -c`），
  `smoke-test.sh` 改成运行中抓场景图并把日志/轨迹留档到 `docker/artifacts/`。
  四份镜像 SHA256 全部 OK。
