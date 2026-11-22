# Falcon 小应用前端生命周期与架构原生化勘查交接报告

## 1. 勘查观测记录 (Observation)

### 1.1 `src/` 目录结构与 `src/pages/index` 残留现状
- **目录结构勘查**（执行命令 `find /Volumes/500GB/Ydpen/halflife_app/src`）：
  ```
  src/
  ├── app.js
  ├── app.json
  ├── base-page.js
  ├── manifest.json
  ├── page-entry.js
  ├── root.js
  └── pages/
      ├── game/
      │   ├── game.js
      │   └── game.json
      └── index/
  ```
- **残留目录排查**（执行命令 `ls -la /Volumes/500GB/Ydpen/halflife_app/src/pages/index`）：
  - 目录大小为 0，仅包含 `.` 与 `..`，没有任何文件。
- **全项目引用检索**（执行命令 `grep -rn "pages/index" /Volumes/500GB/Ydpen/halflife_app`）：
  - 返回退出码 1，匹配结果为 0。全工程无任何代码、配置文件或脚本引用 `pages/index`。
- **macOS 元数据文件**：
  - 目录下存在 AppleDouble 文件：`src/._root.js`、`src/._app.js`。

### 1.2 页面配置与原生启动链条现状
- **应用元数据配置**（`/Volumes/500GB/Ydpen/halflife_app/src/manifest.json`）：
  ```json
  {
    "appName": "半条命",
    "appid": "8002026110400001",
    "version": "1.0.0",
    "icon": "app_icon.png",
    "pages": ["pages/game/game"],
    "quickjs": {
      "version": "20200705",
      "bigNum": false,
      "targets": [
        "app.js.bin",
        "index.js.bin",
        "pages/game/game.js.bin"
      ]
    }
  }
  ```
  `pages` 列表仅声明一个页面 `"pages/game/game"`，作为启动进入的页面。
- **路由映射配置**（`/Volumes/500GB/Ydpen/halflife_app/src/app.json`）：
  ```json
  {
    "pages": {
      "game": "pages/game/game.js"
    },
    "options": {
      "style": { "lessPaths": ["pages"] }
    }
  }
  ```
  `pages` 字典只配置了 `"game": "pages/game/game.js"`。
- **应用入口实现**（`/Volumes/500GB/Ydpen/halflife_app/src/app.js`）：
  - 第 15 行：`var __pages = { game: Component };`
  - 第 23-26 行：
    ```javascript
    onLaunch(o) {
      super.onLaunch(o || {});
      this.setViewPort(960);
      $falcon.useDefaultBasePageClass(BasePage);
      vlog('onLaunch ok, viewport=960');
    }
    ```
  - 第 42-48 行：
    ```javascript
    App.meta = {
      name: '半条命',
      version: '1.0.0',
      isSingleJsBundle: false,
      pages: { game: 'pages/game/game.vue' },
      options: { style: { lessPaths: ['styles'] } }
    };
    ```
- **基类与页面入口挂载**（`/Volumes/500GB/Ydpen/halflife_app/src/base-page.js` 与 `page-entry.js`）：
  - `base-page.js` 第 61-75 行定义 `attachRoot(page)`，通过 `page.setRootComponentOptions(Component)` 将 `Component`（即 `root.js` 编译产物）注入页面。
  - `page-entry.js` 继承 `BasePage`，在 `onLoad` 与 `onNewOptions` 时执行 `attach(this, Component)`。
- **根组件与原生调用**（`/Volumes/500GB/Ydpen/halflife_app/src/root.js`）：
  - 第 12-23 行：
    ```javascript
    launchGame() {
      try {
        if (hl && typeof hl.start === 'function') {
          hl.start({ basedir: '/userdisk/halflife' });
          this.statusText = '战役进行中';
        }
      } catch (e) {
        this.statusText = '启动异常: ' + e;
      }
    }
    ```
  - 第 44-59 行：在 `onShow()` 生命周期钩子中注册硬件返回键，并调用 `this.launchGame()`。
  - 第 85-87 行：`mounted() { this.onShow(); }`。
  - 第 88-133 行：`render(h)` 仅渲染黑色背景及橙色标题与状态文本，没有任何二级启动按钮。

### 1.3 对标千恋万花（Senren Banka）架构基准
- **千恋万花工程路径**：`/Volumes/500GB/Ydpen/senren-banka-ydpen-port`
- **构建机制对比**：
  - `build.py` 第 55 行：`("page-entry.js", ["index.js", "shell.js"])`，将 `page-entry.js` 分发给各页面目录作为入口。
  - `build.py` 第 207-210 行：拷贝 `index.js.bin` 与 `shell.js.bin` 至各个页面目录。
  - `app/app.js`：继承 `$falcon.App`，在 `onLaunch` 中设定 `setViewPort(800)` 并注册 `useDefaultBasePageClass(BasePage)`。
  - 架构完全由 Falcon 生命周期驱动，无需中间 shell 脚本，属于纯粹的原生 mini APP。
- **halflife_app 一致性**：
  - `tools/build_amr.py` 第 41 行同样包含 `("page-entry.js", ["index.js", "shell.js"])`。
  - 第 120-124 行将 `index.js.bin` 和 `shell.js.bin` 部署至 `pages/game/`。
  - 启动链条完全符合 Falcon 原生标准。

### 1.4 原生全屏拉起引擎与参数配置
- **原生插件实现**：`/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`
  - 第 304-347 行：`fork()` 子进程后，配置环境变量：
    ```c
    setenv("XDG_RUNTIME_DIR", "/var/run", 1);
    setenv("LD_LIBRARY_PATH", "/userdisk/halflife:/usr/lib:/lib", 1);
    setenv("WAYLAND_DISPLAY", "wayland-0", 1);
    setenv("SDL_TOUCH_MOUSE_EVENTS", "0", 1);
    setenv("SDL_MOUSE_TOUCH_EVENTS", "0", 1);
    if (access("/userdisk/halflife/libwl_center.so", R_OK) == 0) {
        setenv("LD_PRELOAD", "/userdisk/halflife/libwl_center.so", 1);
    }
    ```
  - 子进程直接 `execl("./xash3d", ...)` 执行底层引擎：
    ```c
    execl("./xash3d", "./xash3d",
          "-basedir", basedir,
          "-game", "valve",
          "-ref", "gles2",
          "-width", "960",
          "-height", "266",
          "+xrcon_address", "127.0.0.1:27000",
          "+xrcon_enable", "1",
          NULL);
    ```
- **居中与全屏拦截**：`/Volumes/500GB/Ydpen/halflife_app/native/wl_center.c`
  - 第 327 行：拦截 `xdg_toplevel` 并调用 `xdg_toplevel_set_fullscreen(g_toplevel, NULL)`。
  - 第 270-284 行：拦截 `wl_egl_window_create`，创建尺寸 960x266、起始坐标为 (0, 107) 的子表面，贴合 960x266 物理显示屏。
  - 第 72-76 行与 147-151 行：将触控与指针的 Y 轴坐标减去 107 偏移量，精确映射至 0..265。

### 1.5 退出生命周期与后退键处理
- **硬件返回键接管**（`src/root.js`）：
  - 第 47-54 行：
    ```javascript
    this._backpressed = function() {
      self.handleBack();
    };
    if (this.$page && this.$page.$npage) {
      this.$page.$npage.setSupportBack(false);
      this.$page.$npage.on('backpressed', this._backpressed);
    }
    ```
  - 第 24-43 行：`handleBack()` 调用 `hl.stop()`；若返回结果为成功，则调用 `this.$page.finish()` 关闭页面退出。
- **后台与销毁钩子**：
  - 第 60-76 行：`onHide()` 恢复 `setSupportBack(true)` 并注销监听，同时调用 `hl.save()` 进行自动存档。
  - 第 77-83 行：`onUnload()` 在组件销毁时检查 `hl.isRunning()`，若仍在运行则调用 `hl.stop()`。
- **底层退出逻辑与异常行为观测**（`native/libjsapi_hl.c`）：
  - 第 202-219 行：
    ```c
    static int stop_game_locked(void)
    {
        if (!is_game_running_locked())
            return 1;
        if (!save_game_locked())
            return 0;
        if (!is_game_running_locked())
            return 1;
        if (!send_xrcon("quit", sizeof("quit") - 1))
            return 0;
        int64_t deadline = monotonic_ms() + HL_EXIT_TIMEOUT_MS;
        while (is_game_running_locked()) {
            if (monotonic_ms() >= deadline)
                return 0;
            poll_pause(deadline);
        }
        return 1;
    }
    ```
  - 在 `save_game_locked()`（第 179-199 行）中：必须在 3000ms 内检测到 `valve/save/quick.sav` 的修改时间更新，否则返回 0。
  - 若保存未完成（例如在主菜单、关卡加载过渡期、角色死亡动画中），`stop_game_locked()` 返回 0，**不会向引擎发送 quit 也不会发送进程终止信号**。
  - 在此情形下，`root.js` 中的 `handleBack()` 获取到失败状态，将 `this.exiting` 重置为 `false` 并中止，不调用 `this.$page.finish()`。

---

## 2. 推理推导链 (Logic Chain)

1. **`src/pages/index` 残留清理推导**：
   - 依据观测 1.1，`src/pages/index` 没有任何内容，全工程搜索亦无任何页面或模块引用。
   - 依据观测 1.2，应用主页面完全配置在 `pages/game/game`。
   - 因此，`src/pages/index` 为开发初期留存的冗余空目录，可以直接移除，对构建与运行时无任何负面影响。

2. **原生启动链条推导**：
   - 依据观测 1.2 与 1.3，Falcon 容器在拉起小应用后，依照 `manifest.json` 自动装载 `pages/game/game`。
   - `BasePage` 挂载 `root.js` 组件，组件生命周期 `onShow()` / `mounted()` 立即触发 `this.launchGame()`。
   - 依据观测 1.4，`launchGame()` 直接通过 C 原生扩展 `hl.start({ basedir: '/userdisk/halflife' })` 完成子进程的 `fork` 与 `exec`。
   - 整个流程在生命周期启动阶段自动完成，完全没有二级页面、无确认弹窗、无前置启动按钮，也不依赖任何外部 shell 脚本。

3. **悬挂进程与黑屏异常因果推导**：
   - 依据观测 1.5，`stop_game_locked()` 的退出机制设计为“仅在确认保存成功后才发送 quit”。
   - 当用户在无法产生有效存档的界面（例如引擎启动加载期或游戏主菜单）按下硬件返回键时，`save_game_locked()` 必定超时返回 0。
   - 此时 `stop_game_locked()` 中止执行退出，`xash3d` 子进程继续留在后台。
   - 若用户通过物理关机按键、息屏或者系统杀进程等外部方式强行关闭 Falcon 宿主应用，`xash3d` 将被系统 init 进程（PID 1）收养，演变为孤儿悬挂进程。
   - 当用户再次启动半条命应用时，新 Falcon 进程中的 `libjsapi_hl.so` 内存变量 `g_hl_pid` 初始为 0。`hl.start()` 无法察觉系统中已有的孤儿进程，再次 `fork` 出第二个 `xash3d` 进程。
   - 两个进程同时争夺 Wayland surface、GLES2 显卡设备上下文与 XRCON 27000 端口，造成新实例无法获得渲染表面，从而产生黑屏异常。

4. **架构加固方向推导**：
   - 为避免悬挂进程与黑屏异常，实施阶段应在原生启动和退出逻辑中增加防范机制：
     - 在 `hl.start()` 执行 `fork()` 之前，先排查并清理系统中遗留的旧 `xash3d` 孤儿进程；
     - 在返回键处理中，若常规保存退出失败，应提供再次点击强制退出的退避路径，允许直接发送 `quit` 或信号终止子进程并关闭页面；
     - 在 `onUnload()` 页面卸载钩子中，无条件执行清理，杜绝遗留孤儿进程。

---

## 3. 注意事项与边界说明 (Caveats)

1. **测试用例契约冲突说明**：
   `tools/test_xrcon.py` 中的单元测试 `test_failed_save_keeps_engine_and_does_not_quit` 与 `test_stop_timeout_keeps_engine_alive` 明确断言了“保存失败时不退出引擎”。如果后续实施 Agent 直接修改 `libjsapi_hl.c` 的核心语义，可能导致这两个宿主机单元测试失败。建议保持原生库中 `stop()` 的存档安全性，而在上层 `root.js` 或增加专门的强退参数（如 `force`）来进行针对性处理。
2. **只读权限遵守说明**：
   本 Agent 严格遵循只读调查约定，未对任何源码、配置文件或目录结构进行写操作。

---

## 4. 勘查结论 (Conclusion)

1. **文件清理目标明确**：
   - 待清理目录：`/Volumes/500GB/Ydpen/halflife_app/src/pages/index`（空目录，直接移除）。
   - 待清理元数据：`/Volumes/500GB/Ydpen/halflife_app/src/._*`（清除 macOS 生成的隐藏文件）。
2. **原生启动架构完备**：
   - 页面配置（`manifest.json`、`app.json`）与组件体系（`app.js`、`base-page.js`、`page-entry.js`、`root.js`）构成单页面直启结构。
   - 小应用由 Falcon 容器拉起后，直接在 `onShow` 中调用 `hl.start({ basedir: '/userdisk/halflife' })` 原生全屏拉起 `xash3d`，无二级按钮与外部脚本。
3. **悬挂进程与黑屏防御方案明确**：
   - 悬挂进程由于保存未确认时中断退出，或宿主被杀导致子进程孤儿化引起；
   - 实施 Agent 可通过“启动前进程清理”与“返回键连续按下强制退出”机制消除黑屏隐患。

---

## 5. 独立验证方法 (Verification Method)

后续实施 Agent 完成操作后，可使用以下指令进行独立验证：

1. **目录清理结果验证**：
   ```bash
   test ! -d /Volumes/500GB/Ydpen/halflife_app/src/pages/index && echo "CLEANED"
   ```
   *预期结果*：输出 `CLEANED`，确认目录已移除。

2. **前端构建与静态检查**：
   ```bash
   node --test /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   ```
   *预期结果*：所有 3 项生命周期单元测试全部通过（pass 3, fail 0）。

3. **真机启动与退出链条验证**：
   ```bash
   /opt/homebrew/bin/adb -s 9DA2200007506350 shell "miniapp_cli start 8002026110400001"
   sleep 2
   /opt/homebrew/bin/adb -s 9DA2200007506350 shell "pidof xash3d"
   ```
   *预期结果*：`xash3d` 进程 PID 正常输出，屏幕直接显示全屏游戏画面，无任何启动器按钮；按返回键退出后，再次执行 `pidof xash3d` 无残留输出。
