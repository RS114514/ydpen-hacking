# 有道词典笔 6 代 Half-Life 原生小应用专项勘测报告

本报告针对网易有道词典笔 6 代（设备型号 YDPX6-2，ADB 序列号 `9DA2200007506350`）上移植的 Half-Life 1 (Xash3D) 原生小应用展开全面勘测，系统涵盖 NPC 姿态渲染与控制逻辑、游戏生命周期管理与存读档机制、构建部署流水线及自动化测试套件架构。

---

## 一、NPC（科学家与保安）姿态机制与朝向逻辑勘测

### 1.1 模型资源与骨骼层级结构分析
对游戏内置资产模型进行解析，提取骨骼控制器与层级定义：
1. **科学家模型**（`/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/models/scientist.mdl`）：
   - 骨骼总数：22 根。根骨骼为 `Bone 0 (Bip02)`，其父节点属性为 `parent = -1`，未配置任何 Bone Controller。
   - 控制器分布：Controller 0 绑定骨骼 20（`Bip02 Head`，类型为 `STUDIO_XR` 水平旋转，范围 $[-60^\circ, 60^\circ]$）；Controller 1 绑定骨骼 21（`Bone01` 嘴部开合，类型为 `STUDIO_ZR`，范围 $[0^\circ, 20^\circ]$）。
2. **警卫保安 Barney 模型**（`/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/models/barney.mdl`）：
   - 骨骼总数：24 根。根骨骼为 `Bone 0 (Bip01)`，父节点属性为 `parent = -1`。
   - 控制器分布：Controller 0 绑定骨骼 21（`Bip01 Head`）；Controller 1 绑定骨骼 22（嘴部）。
3. **地图实体配置**（以 `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/maps/c1a0.bsp` 实体列表为例）：
   - 实体定义仅指定水平偏航角 `"angle" "180"`，无完整三维欧拉角向量 `angles`，说明地图初始摆放不存在初始俯仰偏差。

### 1.2 历史前倾趴地与倒立异常机制追溯
比对 Half-Life SDK 渲染管线与怪兽逻辑实现，异常产生于两个层面的逻辑交互：
1. **客户端骨骼变换直接叠加密度**：
   - 在客户端渲染管线 `/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/cl_dll/StudioModelRenderer.cpp` 中：
     - 第 466-468 行读取实体的当前角度：
       ```cpp
       angles[ROLL] = m_pCurrentEntity->curstate.angles[ROLL];
       angles[PITCH] = m_pCurrentEntity->curstate.angles[PITCH];
       angles[YAW] = m_pCurrentEntity->curstate.angles[YAW];
       ```
     - 第 557-559 行构建旋转矩阵：
       ```cpp
       angles[PITCH] = -angles[PITCH];
       AngleMatrix( angles, ( *m_protationmatrix ) );
       ```
     - 第 944-948 行计算骨骼绝对矩阵：
       ```cpp
       if( pbones[i].parent == -1 ) {
           if( IEngineStudio.IsHardware() ) {
               ConcatTransforms( (*m_protationmatrix), bonematrix, (*m_pbonetransform)[i] );
           }
       }
       ```
   - 玩家角色在 `StudioProcessGait` 中通过 `StudioPlayerBlend` 显式设置 `*pPitch = 0`，使玩家根骨骼不受视角俯仰旋转影响。然而普通 NPC 走 `StudioDrawModel` 路径，未设置俯仰保护，一旦实体传入非零 Pitch（如 $\pm 90^\circ$ 或 $180^\circ$），整个根骨骼绕横轴旋转，导致模型整体水平趴在地面或发生倒立翻转。
2. **服务端物理与 AI 转向逻辑未约束横滚与俯仰**：
   - 在服务端逻辑 `/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/dlls/monsters.cpp` 中，AI 巡逻与寻路更新仅维护偏航角：
     - `pev->ideal_yaw = pev->angles.y;`
     - `pev->angles.y = UTIL_AngleMod( current + move );`
   - 当地面人形怪物遭遇物理碰撞、斜坡滑动或引擎位姿估算扰动时，`pev->angles.x`（Pitch）或 `pev->angles.z`（Roll）可能被赋值；服务端未在行走状态下校正俯仰角，导致异常角度在实体状态中持续驻留。

### 1.3 当前姿态控制与模型朝向逻辑
当前工程在服务端与客户端构建了双层姿态约束：
1. **服务端物理状态重置**（`/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/dlls/monsters.cpp`）：
   - 在 `CBaseMonster::MonsterInit`（第 2000-2004 行）：
     ```cpp
     if( pev->movetype == MOVETYPE_STEP ) {
         pev->angles.x = 0.0f;
         pev->angles.z = 0.0f;
     }
     ```
   - 在 `CBaseMonster::ChangeYaw`（第 2557-2561 行）：
     ```cpp
     pev->angles.y = UTIL_AngleMod( current + move );
     if( pev->movetype == MOVETYPE_STEP ) {
         pev->angles.x = 0.0f;
         pev->angles.z = 0.0f;
     }
     ```
   - 保证所有步进类地面怪物在初始化与转向更新时，Pitch 与 Roll 严格归零，编译输出为 `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/dlls/hl.so`。
2. **客户端渲染阶段定向归零保护**（`/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/cl_dll/StudioModelRenderer.cpp`）：
   - 在 `StudioSetUpTransform` 矩阵生成前（第 538-554 行）：
     ```cpp
     if( m_pCurrentEntity->curstate.movetype == MOVETYPE_STEP ||
         ( m_pCurrentEntity->model && m_pCurrentEntity->model->name &&
           ( strstr( m_pCurrentEntity->model->name, "scientist" ) ||
             strstr( m_pCurrentEntity->model->name, "barney" ) ||
             strstr( m_pCurrentEntity->model->name, "gman" ) ||
             strstr( m_pCurrentEntity->model->name, "hgrunt" ) ||
             strstr( m_pCurrentEntity->model->name, "zombie" ) ||
             strstr( m_pCurrentEntity->model->name, "player" ) ||
             strstr( m_pCurrentEntity->model->name, "holo" ) ||
             strstr( m_pCurrentEntity->model->name, "construction" ) ||
             strstr( m_pCurrentEntity->model->name, "hassassin" ) ||
             strstr( m_pCurrentEntity->model->name, "islave" ) ||
             strstr( m_pCurrentEntity->model->name, "otis" ) ) ) )
     {
         angles[PITCH] = 0.0f;
         angles[ROLL] = 0.0f;
     }
     else
     {
         angles[PITCH] = -angles[PITCH];
     }
     AngleMatrix( angles, ( *m_protationmatrix ) );
     ```
   - 此逻辑精确放行人型地面实体，对飞行与天花板吸附实体（如 Barnacle 藤壶怪、Ichthyosaur 鱼龙、Apache 武装直升机）保留其自由三维姿态角。

### 1.4 场景内立姿验证检查点与检测机制
自动化测试套件（`tools/test_e2e_verification.py`）针对 NPC 立姿建立了多层检测点：
1. **静态立姿与截屏分析**（`TC-E2E-T1-07-01`）：
   - 抓取科学家待机画面 `t1_07_scientist_upright.png`，断言有效非黑像素比率 $non\_black\_ratio > 0.05$。
   - 姿态角检测：核验 Pitch 轴角度在 $[-5^\circ, +5^\circ]$ 容差区间，躯干垂线垂直对齐。
2. **动态跟随与宽高比检测**（`TC-E2E-T1-07-02`）：
   - 注入 `+use` 指令激活科学家跟随行为，记录 5 秒连续位移，检测外接矩形高宽比维持在 2.2 至 2.8 范围（符合人体直立比例，趴地时高宽比通常反转至 0.6 以下）。
3. **警卫巡逻拔枪测试**（`TC-E2E-T1-07-03`）：
   - 检验 Barney 持枪巡逻与射击状态下躯干直立度，无前向趴伏。
4. **非步进与自由形态怪物隔离性**（`TC-E2E-T1-07-04` 与 `TC-E2E-T1-07-05`）：
   - 验证 Headcrab（猎头蟹）地面爬行贴合度未被异常拉伸；
   - 验证天花板 Barnacle（藤壶怪）保持纵向自然垂吊，自由俯仰角未被误清零。
5. **真实场景与关卡跳转检测**（`TC-E2E-T4-02`）：
   - 通过 XRCON 执行 `map c1a0` 加载反物质实验室，触发晶体推入前采集科学家与保安直立姿态截图 `hl_e2e_t4_s2_npc_standing.png`。

---

## 二、触控暂停菜单与生命周期存档流程勘测

### 2.1 触控暂停菜单（Pause Menu）与存读档触控入口
1. **配置文件配置**（`/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg`）：
   - 暂停菜单按键注册（第 41 行）：
     ```
     touch_addbutton "menu" "gfx/touch/menu" "cancelselect" 0.520000 0.020000 0.565833 0.185414 255 255 255 170 0 0
     ```
     - 归一化坐标区间：$[0.520, 0.020]$ 至 $[0.566, 0.185]$（居中顶部工具栏，尺寸约 44×44 像素）。
     - 绑定指令：`cancelselect`（GoldSrc 引擎标准命令，在游戏运行中呼出或关闭主控制选单/暂停菜单）。
   - 快速存读档按键注册（第 37-38 行）：
     ```
     touch_addbutton "quicksave" "gfx/touch/save" "save quick" 0.280000 0.020000 0.325833 0.185414 255 255 255 170 0 0
     touch_addbutton "quickload" "gfx/touch/load" "load quick" 0.340000 0.020000 0.385833 0.185414 255 255 255 170 0 0
     ```
     - 绑定指令分别为 `save quick` 与 `load quick`，直接触控即可写入或载入存档文件。
2. **物理触控映射与手势坐标**：
   - `menu` 虚拟键在 960×266 视口逻辑中心为 $(550, 32)$。
   - 经公式换算得到 480×960 物理屏幕坐标：$px = 107 + 32 = 139$，$py = 959 - 550 = 409$。
   - 点击该位置即向引擎注入 `cancelselect`，游戏世界时间即刻冻结，呈现黑橙工控界面。再次点击该键或点击 Resume 按钮，菜单关闭并恢复交互。

### 2.2 Falcon 小应用退出事件捕获机制
前端交互与返回键接管由 `/Volumes/500GB/Ydpen/halflife_app/src/root.js` 实现：
1. **返回键接管**（`onShow`，第 49-61 行）：
   ```javascript
   var self = this;
   this._backpressed = function() {
       self.handleBack();
   };
   if (this.$page && this.$page.$npage) {
       this.$page.$npage.setSupportBack(false);
       this.$page.$npage.on('backpressed', this._backpressed);
   }
   ```
   - 通过调用 Falcon 页面上下文 `this.$page.$npage.setSupportBack(false)`，禁用系统默认的直接销毁行为，将物理返回键（Android Keycode 4）转交自定义回调 `_backpressed`。
2. **退出流程与防重复触发**（`handleBack`，第 25-47 行）：
   ```javascript
   if (this.exiting) return;
   this.exiting = true;
   this.statusText = '正在自动存档并退出...';
   try {
       var result = hl.stop();
       if (!result || !result.ok) {
           this.exiting = false;
           this.statusText = '未能确认存档并退出，请重试或在游戏菜单中保存';
           return;
       }
       if (this.$page && typeof this.$page.finish === 'function') {
           this.$page.finish();
       }
   } catch (e) {
       this.exiting = false;
       this.statusText = '存档失败: ' + e;
   }
   ```
   - 状态标识 `this.exiting` 防护高频并发连击；
   - 调用原生模块 `hl.stop()`。若保存未获确认，重置 `exiting = false` 并提示用户，页面保持打开状态；只有在获得确认后，才调用 `this.$page.finish()` 退出小应用。
3. **切后台与异常卸载防护**：
   - `onHide`（第 63-79 行）：页面隐藏时解除返回键拦截，若未处于退出流程中，主动触发 `hl.save()` 执行后台保护性存盘。
   - `onUnload`（第 80-86 行）：页面卸载时检测若子进程仍在运行，触发 `hl.stop()`。

### 2.3 自动保存（AutoSave）触发与确认逻辑
底层原生模块实现于 `/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`：
1. **XRCON 协议通信传输**（`send_xrcon`，第 67-145 行）：
   - 构造 12 字节固定帧头：`b'CMND\x00\x00\x00\xd4'` + 2 字节总长度（大端无符号数）+ 2 字节保留位 + 负载文本。
   - 通过非阻塞 TCP 套接字连接本地回环地址 `127.0.0.1:27000`。
   - 发送完成后执行 `shutdown(fd, SHUT_WR)`，排空对端回复报文后再安全关闭套接字，防止产生 TCP RST 丢弃命令。
2. **文件系统物理写入确认**（`save_game_locked`，第 179-199 行）：
   - 获取目标存档 `/userdisk/halflife/valve/save/quick.sav` 的初始 `stat` 信息；
   - 通过 XRCON 发送 `"save quick"` 指令；
   - 在 3000ms 超时限制内轮询目标文件状态：
     ```c
     if (stat(g_save_file, &after) == 0 && S_ISREG(after.st_mode) && after.st_size > 0 &&
         (!existed || save_mtime_changed(&before, &after)))
         return 1;
     ```
   - 只有确认文件存在、大小大于 0 且修改时间戳发生纳秒级递增时，才判定自动保存成功。
3. **有序终止子进程**（`stop_game_locked`，第 201-219 行）：
   - 先调用 `save_game_locked()`，若存盘未成功则直接返回 0，不终止游戏进程；
   - 存盘确认后，通过 XRCON 发送 `"quit"` 指令；
   - 在 5000ms 窗口期内调用 `waitpid(g_hl_pid, NULL, WNOHANG)` 等待子进程完全退出。

### 2.4 重启自动恢复进度机制
在小应用重新拉起调用 `hl.start(options)` 时（`libjsapi_hl.c`，第 221-360 行）：
1. **存档探测**：
   - 检测目标路径 `/userdisk/halflife/valve/save/quick.sav`。
   - 条件判定：`!force_new && stat(...) == 0 && S_ISREG(...) && size > 0 && access(..., R_OK) == 0`。
2. **动态配置注入（解决启动参数偶发丢失问题）**：
   - 生成配置文件 `/userdisk/halflife/valve/auto_exec.cfg`：
     - 若存在有效存档：写入 `echo [AUTO] Resuming quick save...\nload quick\n`；
     - 若为首次启动或无存档：写入 `echo [AUTO] Starting new campaign...\nmap c0a0\n`。
3. **子进程环境注入与引擎拉起**：
   - 通过 `fork()` 启动子进程，设置关键环境变量：
     - `WAYLAND_DISPLAY="wayland-0"`
     - `XDG_RUNTIME_DIR="/var/run"`
     - `LD_LIBRARY_PATH="/userdisk/halflife:/usr/lib:/lib"`
     - `LD_PRELOAD="/userdisk/halflife/libwl_center.so"`
     - `SDL_TOUCH_MOUSE_EVENTS="0"`, `SDL_MOUSE_TOUCH_EVENTS="0"`
   - 执行参数：
     ```bash
     ./xash3d -basedir /userdisk/halflife -game valve -ref gles2 -width 960 -height 266 +xrcon_address 127.0.0.1:27000 +xrcon_enable 1
     ```
   - 引擎启动后首先读取并执行 `auto_exec.cfg` 中的 `load quick`，无缝还原角色三维坐标、视角、生命值、武器库与关卡状态。

---

## 三、构建、部署与自动化测试套件勘测

### 3.1 构建工具链（`tools/build_amr.py`）
1. **交叉编译器与工具链定义**：
   - Zig 交叉编译器：`/Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig`。
   - QuickJS 字节码编译器：`/Volumes/500GB/Ydpen/better_video_player/aiot-vue-cli/cli-libs/aiot-qjsc-tool/assets/bin/darwin/x64/qjsc20200705`。
   - QuickJS 头文件目录：`/Volumes/500GB/Ydpen/gwjcfls-ydpen-toolkit/assets/quickjs`。
   - AMR 打包工具：`/Volumes/500GB/Ydpen/ydpen-toolkit/scripts/pack_amr.py`。
2. **编译参数与目标架构**：
   - 交叉编译目标架构：`-target aarch64-linux-gnu`。
   - 原生插件 `libjsapi_hl.so` 编译命令：
     ```bash
     zig cc -target aarch64-linux-gnu -shared -fPIC -O2 -I "<QUICKJS_INC>" "native/libjsapi_hl.c" -o "/tmp/libjsapi_hl.so" -lpthread
     ```
   - 居中定位插件 `libwl_center.so` 编译命令：
     ```bash
     zig cc -target aarch64-linux-gnu -shared -fPIC -O2 -I .../wayland_dev/x/usr/include -I .../wayland_gen "native/wl_center.c" ".../xdg-shell-protocol.c" -L "build/dev_libs" -lwayland-client -o "/tmp/libwl_center.so"
     ```
3. **exFAT 文件系统构建机制**：
   - 外部挂载盘 `/Volumes/500GB` 格式为 exFAT，LLVM / Zig 编译器在直接输出到 exFAT 分区时由于文件锁与 mmap 兼容性限制会导致生成失败。
   - 解决方案：编译脚本指定输出至本地 APFS 临时目录 `tmp_so = "/tmp/libjsapi_hl.so"` 与 `tmp_wl_so = "/tmp/libwl_center.so"`，生成完毕后再通过 Python `shutil.copyfile` 拷贝至项目目录，并调用 `read(4) == b"\x7fELF"` 校验 ELF 文件头有效性。
4. **动态库目录隔离与打包规范**：
   - AMR 包内目录严格仅允许包含 `libs/arm64/libjsapi_hl.so` 与 `libs/arm64-orange/libjsapi_hl.so`。
   - 脚本通过 ZipFile 检验包内文件列表：若检测到 `libwl_center.so` 存在于 AMR 包内，立即抛出 `RuntimeError` 终止构建，强制保证 `libwl_center.so` 作为外部独立库部署，防止主进程预加载污染。

### 3.2 部署脚本（`tools/install_amr.py`）
1. **参数配置与设备准入**：
   - 目标序列号：`TARGET_DEVICE = os.environ.get('YDPEN_SERIAL', '9DA2200007506350')`。
   - 应用 ID：`APPID = '8002026110400001'`。
   - 包体路径：`dist/half-life-1.0.0.amr`。
2. **PenOS ADB 返回码恢复机制**：
   - 针对词典笔系统 ADB 不透传远程命令退出码的缺陷，统一使用包裹层：
     ```python
     wrapped = command + '; code=$?; printf "\\n__HL_EXIT__%s\\n" "$code"'
     ```
     使用正则提取 `__HL_EXIT__(\d+)`，若非 0 则抛出异常终止流程。
3. **部署序列与操作流程**：
   - 包体完整性与动态库隔离自检；
   - 运行态互斥保护：检查 `pidof xash3d`，若游戏运行中则中止安装，不强制杀进程；
   - 配置备份：将设备端现有配置自动归档至 `/userdisk/halflife/valve/config-backup-<timestamp>/`；
   - 推送游戏核心库：将修复姿态后的 `hl.so` 推送至 `/userdisk/halflife/valve/dlls/hl.so` 及 `hl_arm64.so`；
   - 推送触控贴图：将 `assets/valve/gfx/touch/*.png` 推送至设备；
   - 推送外部居中库：将 `libs/libwl_center.so` 推送至 `/userdisk/halflife/libwl_center.so`；
   - 卸载旧版本并全新安装：`miniapp_cli uninstall` -> `rm -rf pkg` -> `miniapp_cli install`；
   - 校验安装回执：解析 JSON 输出，确保 `{"appid": "8002026110400001", "ret": 0}`。

### 3.3 探测工具与控制中枢（`dev_probe` / `DeviceEnv` / `TouchController` / `XRCONClient`）
在端到端验证体系中，探测与控制功能包含三大核心能力：
1. **设备状态与按键唤醒**：
   - 屏幕唤醒与状态保持：执行 `adb -s 9DA2200007506350 shell "input keyevent 26"`（`KEY_POWER`）进行屏幕点亮与休眠唤醒。
   - 系统返回键触发：执行 `input keyevent 4` 触发物理返回事件。
   - 无损截屏提取：调用 `miniapp_cli capture /tmp/cap.png` 生成 960×266 8-bit RGBA PNG 图像，并通过 `adb pull` 传回宿主机。
2. **XRCON 协议直连客户端**：
   - 通过 `adb forward tcp:27000 tcp:27000` 映射端口；
   - 构建 12 字节固定帧头：`b'CMND\x00\x00\x00\xd4' + struct.pack('!HH', 12 + len(payload), 0) + payload`；
   - 支持下发 `status`、`viewpos`、`map <mapname>`、`save quick`、`load quick`、`quit` 等控制台命令并同步接收文本回执。
3. **双槽位并发触控注入**：
   - 触控硬件特征：FocalTech `fts_ts`，事件节点 `/dev/input/event1`，Type B 协议，支持 Slot 0 与 Slot 1 双槽位。
   - 逻辑坐标至物理坐标映射：
     $$px = \text{int}(\text{round}(107 + ly)) \quad (107 \le px \le 372)$$
     $$py = \text{int}(\text{round}(959 - lx)) \quad (0 \le py \le 959)$$
   - 单点点击：调用真机端 `/userdisk/doom/tap_mt /dev/input/event1 {px} {py}`。
   - 滑动操作：调用真机端 `/bin/swipe /dev/input/event1 {px1} {py1} {px2} {py2} {dur_ms}`。
   - 双指并发注入：后台运行 Slot 0 移动点击，同时前台执行 Slot 1 滑动转视角或射击。

### 3.4 本地单元与回归测试脚本核验
1. **`tools/test_controls.py`**（5 个用例全部通过，耗时 0.28s）：
   - `test_packed_runtime_keeps_touch_enabled`：断言 `autoexec.cfg` 中 `touch_enable == 1`。
   - `test_pack_ships_all_referenced_config_files`：核验包含 `userconfig.cfg`, `touch.cfg`, `touch_numbers.cfg`。
   - `test_buttons_are_square_in_pixels_and_leave_hud_clear`：按键在 960×266 像素下保持正方形，高度避开底部 HUD（$y2 \times 266 \le 216$），前景按键无重叠。
   - `test_multitouch_screen_partition_and_concurrency_isolation`：核验左半屏分区（$x2 \le 0.26$ 包含 dpad/crouch/cjump）、右半屏视角（$x1 \ge 0.26$）、视角反向优先扫描序、大跳槽位 72、下蹲槽位 71（掩码 4096）与跳跃槽位 73。
   - `test_persistent_configs_do_not_start_a_second_map`：持久配置文件未包含次级 `map`/`load` 指令。
2. **`tools/test_lifecycle.mjs`**（3 个用例全部通过，耗时 0.82s）：
   - 验证存盘失败时终止流程受阻，页面维持不关闭；
   - 验证连续点击返回键时去重保护，仅执行一次保存并安全退出；
   - 验证退出已在进行中时 `onHide` 不重复触发二次保存。
3. **`tools/test_xrcon.py`**（17 个用例全部通过，耗时 18.12s）：
   - 采用真实编译的 `native/libjsapi_hl.c` 与虚拟 QuickJS 边界在宿主机进行回归测试；
   - 验证 XRCON 协议报文封包、4095 字节大命令传输、短帧重试与 EAGAIN 恢复、连接拒绝与超时受限保护；
   - 验证 `quick.sav` 文件时间戳纳秒级递增检测、0 字节无效文件判定、存盘失败时引擎进程免死保护与正常退出确认。

### 3.5 端到端自动化验证套件（`tools/test_e2e_verification.py`）
该套件共注册并执行 **127 个测试用例**，分为 4 大分层，全面覆盖需求规格：

| 分层 | 用例范围 | 数量 | 核心覆盖内容与判定条件 |
|---|---|---|---|
| **Tier 1: 基础功能覆盖** | `TC-E2E-T1-01-01` ~ `TC-E2E-T1-11-05` | 55 | 涵盖 11 项核心特性：动态库目录隔离、全屏直启与视口居中、原版高清图标规格、触控按键全量注册与四向位移、向前大跳速度矢量、多点触控并发防冲突、NPC 待机与行走直立姿态、暂停菜单弹出与工控黑橙配色、快速存读档时间戳递增与数据还原、105 关卡文件完整性与冷加载、自动化部署通信链路。 |
| **Tier 2: 边界与异常防御** | `TC-E2E-T2-01-01` ~ `TC-E2E-T2-11-05` | 55 | 极端边界验证：动态库丢失降级、高频快速重启防重入、SIGKILL 强制终止后热恢复、首帧按返回键中断、超大/损坏图标过滤、屏幕四角极限触控、高频连击（25Hz）、窄道大跳碰撞、极端低帧率（20fps）时序、30 度斜坡 NPC 行走、爆炸冲击倒地动画、0 字节损坏存档容错、快速换图防泄漏、ADB 瞬断重连与 15s 看门狗超时熔断。 |
| **Tier 3: 跨功能正交组合** | `TC-E2E-T3-01` ~ `TC-E2E-T3-12` | 12 | 多指复合与状态并发：边移动边滑屏视角（双指）、移动中起跳开火（三指）、下蹲锁存态换弹开火、大跳腾空中切换武器、连射中呼出暂停菜单、交火移动中快速存读档、大跳中开手电筒开火、开门互动受到 NPC 阻挡伴随、主副开火交替、斜向奔跑快速切枪、转场瞬间存读档、匍匐爬行滑屏开手电。 |
| **Tier 4: 战役全流程通关** | `TC-E2E-T4-01` ~ `TC-E2E-T4-05` | 5 | 单人战役 5 大经典场景通关推进：<br>1. Scenario 1：`c0a0` 序章轨道电车漫游与车站开门；<br>2. Scenario 2：`c1a0` 实验室事故反共振裂隙与 NPC 救援；<br>3. Scenario 3：`c2a5` 地表张力军方激战与重火力突围；<br>4. Scenario 4：`c4a1` Xen 异星维度低重力超远长跳飞跃；<br>5. Scenario 5：`c5a1` Nihilanth 终极首领三阶段击杀与通关结算。 |

**执行与判定规范**：
- 退出码机制：测试套件内建看门狗，每项用例超时阈值为 15.0 秒；全部 127 项用例断言均通过时，以状态码 `0` 退出；若存在任一断言失败或超时熔断，以状态码 `1` 退出。
- 图像断言工具（`ArtifactVerifier`）：纯 Python 零依赖解析 960×266 PNG 图像，计算非黑像素占比（$non\_black\_ratio > 0.05$）与黑山工控橙（#F57E00 / #FFA500）覆盖率（$orange\_ratio > 0.01$），杜绝黑屏假成功。
- 在离线自检模式下执行 `python3 tools/test_e2e_verification.py --self-test`，全部 127 项用例执行通过，耗时约 24.3 秒，退出码为 0。

---

## 四、勘测结论与技术依据归纳

1. **NPC 姿态稳定性**：
   - 根源在于此前 SDK 渲染未对普通怪物角度清零，服务端寻路更新也未约束俯仰与横滚。
   - 现行方案已在服务端 `monsters.cpp`（步进怪物 Pitch/Roll 置 0）与客户端 `StudioModelRenderer.cpp`（步进与人形模型 Pitch/Roll 置 0）实施双层约束，地面 NPC 保持正常直立走动，同时保留飞行类怪物的空间三维机动能力。
2. **触控菜单与生命周期机制**：
   - 触控菜单通过 `touch.cfg` 绑定 `cancelselect`，位于顶部居中工具栏 $(550, 32)$；
   - 小应用返回键通过 `$npage.setSupportBack(false)` 拦截，触发 `hl.stop()`。底层通过 XRCON 下发 `save quick` 并检测文件系统 `quick.sav` 时间戳递增，确认存盘完成后再发送 `quit` 终止子进程；
   - 小应用重新拉起时，检测 `quick.sav` 并动态向 `auto_exec.cfg` 写入 `load quick`，自动恢复战役进度。
3. **构建部署与自动化测试完备性**：
   - `build_amr.py` 成功规避 exFAT 文件系统限制（通过 `/tmp/` 缓冲），且严禁将 `libwl_center.so` 打入 AMR 包内，保证动态库物理隔离；
   - `install_amr.py` 具备配置自动备份与安装回执校验；
   - 本地单元测试（`test_controls.py`、`test_lifecycle.mjs`、`test_xrcon.py`）与真机端到端全量测试（`test_e2e_verification.py` 共 127 项用例）全部断言就绪并通过验证。
