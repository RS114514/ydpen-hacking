# 有道词典笔 YDPX6-2 (X6 Pro) 搞机与生态开发全套工具链

本项目收录了对**网易有道词典笔 YDPX6-2 (X6 Pro / RK3562)** 进行系统逆向、权限认证、触控坐标映射、Falcon 小程序构建、应用移植、自研多媒体播放器以及**哔哩哔哩（PenBili）深度定制改造**的完整工程代码与技术文档。

---

## 一、 硬件与系统平台全景

- **主控芯片**：Rockchip RK3562 (四核 Cortex-A53 @ 2.0GHz, Mali-G52 GPU)
- **操作系统**：PenOS 4.3.5 (基于 aarch64 Linux 5.10.66)
- **显示服务**：Weston (Wayland 合成器)，逻辑输出分辨率 **960 × 266**（屏幕物理顺时针旋转 90 度，`transform=rotate-90`）
- **触控传感器**：FocalTech `fts_ts` (`/dev/input/event1`)，硬件物理最大测量范围为 **X: 0~480, Y: 0~960**
- **应用运行时**：网易有道自主研发的 **Falcon 引擎**（基于嵌入式 QuickJS 字节码解释执行与 Vue 2.6 前端框架轻量定制版）

---

## 二、 基础访问与权限认证

设备通过 USB 或同局域网 Wi-Fi 开启 ADB 服务（默认端口 5555）。

```bash
# 1. 连接设备（USB 自动枚举，无线需指定 IP）
adb connect 192.168.31.30:5555

# 2. 获取 root 权限（Shell 认证口令）
printf 'ydpen2026\n' | adb -s 192.168.31.30:5555 shell auth
```

---

## 三、 触控物理坐标映射算法与模拟工具

由于 Wayland（Weston）在显示层进行了 `rotate-90` 旋转，显示输出为横屏 960 × 266，但触摸芯片输出的仍是竖屏原始物理坐标。

### 坐标转换公式
设逻辑屏幕点击坐标为 $(X_{screen}, Y_{screen})$，对应发送到 `/dev/input/event1` 的物理硬件事件坐标 $(X_{raw}, Y_{raw})$ 如下：
$$X_{raw} = (266 - Y_{screen}) \times 1.8$$
$$Y_{raw} = X_{screen}$$

### 触控测试工具 (`/userdisk/bin/tap`)
项目内置编译了 Linux aarch64 原生可执行二进制 `tap`：
```bash
# 语法：/userdisk/bin/tap <input_device> <phys_x> <phys_y>
# 示例：点击屏幕中心
/userdisk/bin/tap /dev/input/event1 240 480
```

---

## 四、 Falcon 小程序工具链与打包机制

Falcon 小程序打包为 `.amr`（即 ZIP 压缩包，内置特定目录与 QuickJS 字节码）。

### 核心规范
1. **源码编译**：JS 源码必须使用词典笔系统内置的 QuickJS 字节码编译器 `jsfmc`（或配套 toolkit）转为 `.js.bin`。
2. **包结构**：
   - `manifest.json`：定义应用 ID、入口页面及字节码索引
   - `app.js.bin`：应用生命周期
   - `index.js.bin`：页面主逻辑
   - `libs/arm64`：C++ 原生动态链接库插件（通过 `libjsapi_*.so` 扩展 QuickJS 原生 API）
3. **系统安装与 A/B 分区**：
   ```bash
   # 正规安装（写入 packages.json 并完成热加载）
   /usr/bin/miniapp_cli install /tmp/your_app.amr
   # 启动应用
   /usr/bin/miniapp_cli start <appid>
   # 截图验证
   /usr/bin/miniapp_cli capture /tmp/screen.png
   ```

---

## 五、 重点子工程与核心成果

### 1. 哔哩哔哩（PenBili）深度定制 (`build_penbili_final.py`)
- **应用 ID**：`8002026091900004`
- **左侧导航栏等高自适应**：
  - 彻底去除左上角 `PenBili` 品牌标题，释放垂直空间。
  - 导航 Tab 调整为 40px 高度，完整展示 **【推荐】、【热门】、【搜索】、【我的】、【缓存】** 5 个功能按钮。
- **保留原有功能**：
  - 完整保留【我的】页面中已登录的个人中心（如 `RS_TV`）及观看历史。
- **本地缓存播放 Tab**：
  - 动态扫描 `/userdisk/Favorite/Movies/*.mp4`。
  - 点击缓存视频卡片，自动调用后台硬件加速播放器播放。
- **死循环根因与解决方案**：
  - 此前在 render 函数中动态修改响应式变量 `this.tab` 导致触发无限更新队列（`infinite update loop in a component render function`）。
  - 修复方案：在 `selectTab` 层面将缓存列表接入 `computed.currentItems` 单向计算属性，render 钩子中仅对 VNode 进行纯内存操作，彻底根治死循环。
- **播放页面下载功能**：
  - 左侧控制栏（返回列表、暂停/开始、前进后退）原样保留，不受任何干扰。
  - 右侧【评论区】正下方定制深蓝高亮胶囊按钮，点击动态反馈状态并唤起后台脚本 `/userdisk/bin/bili-download &`。

### 2. 自研多媒体播放器 (`better_video_player` / `video_player`)
- **应用 ID**：`8002026102300004`
- 基于 Rockchip MPP / RGA 硬件视频解码和 ALSA 音频输出开发，解决小内存环境下的音画同步、掉帧与卡顿问题。
- 配套提供前端选片列表与视频播放界面。

### 3. 屏幕投屏与控制服务 (`screen_cast_app`)
- **应用 ID**：`8002026102400001`
- 服务端后台服务：`ydpen_screensrv`、`screen_on`、`screen_off`。
- 实现低延迟将词典笔屏幕画面投射至电脑浏览器。

### 4. 系统终端 (`pen_term_repo`)
- **应用 ID**：`8001999000000001`
- 挂载 C++ 原生伪终端（PTY）插件 `libjsapi_term.so`，直接在词典笔屏幕上提供交互式 Shell 控制台。

### 5. 文件互传服务 (`file_transfer_app`)
- **应用 ID**：`8002026102300005`
- 配合词典笔本地 Web 服务器，支持手机与电脑通过 Wi-Fi 直传本地视频和文档至 `/userdisk/Favorite/Movies/`。

### 6. 移植游戏与小工具 (`games` / `senren_banka`)
- 移植经典游戏与 Galgame 引擎（《千恋＊万花》`8002026102400099`、五子棋、地牢探险、Bad Apple 字符画播放等）。

---

## 六、 目录结构说明

```
.
├── README.md                  # 本文档
├── build_penbili_final.py     # 哔哩哔哩（PenBili）完整编译打包脚本
├── build_amr_offline.py       # 离线 AMR 打包辅助工具
├── build_cast_apps.py         # 投屏与互传应用构建脚本
├── ydpen-toolkit/             # 词典笔底层逆向工具箱（jsfmc、部署脚本、签名库）
├── better_video_player/       # 自研播放器工程（C++ 插件 + 前端）
├── video_player/              # 独立视频播放器应用
├── screen_cast_app/           # 投屏小程序前端与资源
├── file_transfer_app/         # 文件互传小程序工程
├── pen_term_repo/             # 终端小程序工程
├── senren_banka/              # 《千恋＊万花》移植应用
├── games/                     # 五子棋、地牢、Bad Apple 等小游戏集合
└── aichat_repo/               # 词典笔系统规范与前端手册 (falcon-ui-handbook.md)
```

---

## 七、 维护与贡献说明

本项目所有代码与方案均基于真实硬件实测验证。提交 PR 时请确保保留官方系统签名元数据与包管理器注册流程。
