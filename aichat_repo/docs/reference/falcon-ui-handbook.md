# 有道词典笔 X5 · Falcon mini-app UI/前端约定手册

**目标**：写一个原生观感的 AI 聊天客户端（Vue 2 SFC / QuickJS / 逻辑画布 800×254 / setViewPort(800)）。
**证据来源**：`doge-calculator-main`、`doge-reader-main`、`doge-comic-main`（工作区里也在，多 4 个组件 + `seekbar`/`richtext`/`fs` 用法）、`PenBili-2.3.1`（= `C:\Users\PC\Desktop\PenBili-main` 同一份源码，`src/` 27 个文件与 `tools/deploy.ps1` 逐字节相同）、以及**构建工具与运行时源码**（`PenBili-main/node_modules/aiot-vue-cli@1.0.32`、`node_modules/falcon-ui@1.0.3`）、设备 profile `PenBili-main/profiles/youdao-x5.md`。

所有引用格式为 `路径:行号`，路径相对工程根；工具链路径相对 `C:\Users\PC\Desktop\PenBili-main\`。

---

## 0. 十条铁律（先看这个）

1. **每个 `.vue` 必须自带 `<style lang="less" scoped>` 块**，否则该文件的样式**完全不进 bundle**（页面全黑）。构建器源码级证据见 §2。
2. **`app.json.options.style.lessPaths` 不是全局注入**，它只是 Less 的 `@import` 搜索路径（`less.render({paths})`）。要复用样式必须每个 `.vue` 里写 `@import "../../styles/base.less";`。
3. **CSS 只支持「单类选择器」**：`.a { }`、`.a:active { }` 可以；`.a .b`、`div`、`.a.b`、`.a, .b`、`[data-v-x]` **全部被丢弃**（构建期 warning）。所以状态样式必须拆成扁平单类（`.tab-on`、`.g-ok`），靠 `:class` 切换。
4. **`overflow` 只允许 `visible | hidden`**，**没有 `overflow: scroll`**。滚动只能用 `<scroller>` 组件。
5. **`display` 只允许 `flex`**；`div` 默认 `flex-direction: column`、`flex-shrink: 0`、`align-items: stretch`。横排必须显式 `flex-direction: row`。
6. **原生事件的冒泡默认被关闭**（构建期自动加 `.stop`）。嵌套 `@click` 不会冒到父节点，除非父节点写 `bubble="true"`。
7. **文本必须放在 `<text>` 里**；`lines: N` 是本平台的截断属性（不是 `-webkit-line-clamp`），配 `text-overflow: ellipsis`。
8. **图片用 `<image :src="require('...png?base64')">`**；`?base64` 让它内联成 data URI，不加则拷到 `images/<md5>.png`。`<img>` 不是示例中的用法。
9. **`.vue` 里的 JS 必须走 `export default { ... }`**，`onShow/onHide/onUnload` 写成 **methods**（框架通过 `this.$root.onXxx()` 调用）。
10. **产出是 QuickJS 字节码 `.js.bin`**（不是文本 JS）：产物断言只能 grep 结构标识符/字符串字面量，grep CSS 文本（`.g-ok`）必然失败。
11. **硬件返回键要接管**：`this.$page.$npage.setSupportBack(false)` + `$npage.on('backpressed', fn)`（`onHide` 里恢复），否则返回键直接把页面关掉（§6.3c）。

---

## 1. 工程骨架

### 1.1 最小文件集

```
<appRoot>/
  package.json          # 必需：appid/version/icon/quickjs/single-js-bundle
  app_icon.png          # 必需（package.json.icon 指向它；缺了桌面不显示）
  src/
    app.js              # 必需（构建器硬编码入口）
    app.json            # 必需（pages/options）
    base-page.js        # 可选但强烈建议（页面基类；被 app.js 引用）
    styles/
      var.less          # 可选
      base.less         # 可选
    assets/             # 可选（图片；自解释目录名，见 §8）
    pages/
      index/index.vue   # 必需：至少一页
  libs/                 # 可选：自定义 native .so（会被 syncDirs 同步进包）
  api-mock/             # 可选：`-m` 模拟 JSAPI 时使用
  jsworkers/, assets/   # 可选：顶层 assets/ 也会被同步进包
```

构建器校验的「有效工程」条件（`aiot-vue-cli/src/libs/appinfo.js:44-59`）：

```js
const valid = fs.existsSync(path.resolve(appRoot, 'package.json'))
  && (fs.existsSync(path.resolve(appRoot, APP_SOURCE_DIR, 'app.js'))       // src/app.js
    || fs.existsSync(path.resolve(appRoot, APP_SOURCE_DIR, 'app-meta.js'))); // 已废弃
```

### 1.2 `package.json`（完整可抄）

以 PenBili 为骨架（`PenBili-main/package.json:1-42`），字段含义逐条注释：

```jsonc
{
  "name": "bili-app-x5",          // 包名（英文/短横线）。manifest 优先用 appName，缺省回退 name
  "appName": "PenBili",           // 桌面显示名（中文/任意）。manifest.js:23 取值顺序 appName → name
  "appid": "8002026091900004",    // 16 位、以 800 开头（build.js:91 的校验文案）；决定 .amr 文件名
  "version": "2.3.0",             // → manifest.version；.amr 文件名里点变下划线：2_3_0
  "icon": "app_icon.png",         // 相对工程根；会被拷到产物根目录（manifest.js:34-43）
  "description": "…",
  "quickjs": { "version": "20200705", "bigNum": false },  // 传给 qjsc 的版本与 bignum 开关
  "simulator": { "path": "", "page": "" },                // 模拟器预览配置，可空
  "single-js-bundle": false,      // false=每页一个 chunk（多页推荐）；true=全塞进 app.js
  "scripts": {
    "build":     "node ../env/node_modules/aiot-vue-cli/src/cli.js -q -p",
    "build:dev": "node ../env/node_modules/aiot-vue-cli/src/cli.js",
    "build:prod":"node ../env/node_modules/aiot-vue-cli/src/cli.js -c -q -p",
    "deploy":    "powershell -NoProfile -ExecutionPolicy Bypass -File tools/deploy.ps1",
    "icon":      "python tools/make_icon_v2.py favicon.ico tools/icon_colors.json && node tools/make_icon_v2.js"
  },
  "keywords": ["youdao", "dictionary-pen", "falcon", "miniapp"],
  "dependencies": { "falcon-ui": "1.0.3" },        // 只影响 theme 解析，见 §3.4
  "devDependencies": { "@resvg/resvg-js": "^2.6.2" }  // 仅本地生成图标用
}
```

dog 系工程用 `aiot-cli` 全局 bin（`doge-calculator-main/package.json:18-30`）：

```json
"scripts": {
  "start": "aiot-cli preview",
  "build": "aiot-cli -p",
  "build:dev": "aiot-cli",
  "build:bin": "aiot-cli -q -p",
  "build:prod": "aiot-cli -c -q -p",
  "build:bin-nopack": "aiot-cli -q",
  "build:web": "aiot-cli build-web",
  "build:simulator": "aiot-cli simulator ./",
  "upload": "aiot-cli upload -n",
  "check": "aiot-cli check"
}
```

**`appid` 格式**：构建器只在缺失时报错，错误文案给出了规则（`cli-actions/build.js:84-95`）：

```
ERROR: 打包失败，找不到应用的appid，请在根目录下的package.json中配置，例如：
  { "name": "xxxxxx", "appid": "8000251822789980", ... }
  注：appid要求长度为16，以800开头
```

实测样本：`8001145141919810`、`8001145141919811`、`8002026091900004`（均 16 位、800 开头）。

### 1.3 `src/app.json`（页面注册 + options）

dog 系（**页面直接指向 `.vue`，无页面 JS**）——`doge-reader-main/src/app.json:1-12`：

```json
{
  "pages": {
    "index": "pages/index/index.vue",
    "filemanager": "pages/filemanager/filemanager.vue",
    "reader": "pages/reader/reader.vue",
    "setting": "pages/setting/setting.vue"
  }
}
```

PenBili（**页面指向 `.js`，`.js` 里 `setRootComponent(.vue)`**）——`PenBili-main/src/app.json:1-13`：

```json
{
  "pages": {
    "index": "pages/index/index.js",
    "diag": "pages/diag/diag.js"
  },
  "options": {
    "style": { "lessPaths": ["styles"], "theme": "theme-dark" },
    "alias": {}
  }
}
```

字段含义（全部源码可查）：

| 字段 | 含义 | 证据 |
|---|---|---|
| `pages` | `页面名 → 相对 src 的入口路径`。**页面名的 camelCase 会被加 `_` 前缀**做变量名防冲突（`_index`、`_fileManager`） | `rollup-plugins/app.js:14-30` |
| `pages[x]` 是 `.vue` 还是 `.js` | 都接受，逻辑不同：`.vue` → 该文件即 rollup entry，运行时由**默认页面基类**实例化；`.js` → 你的 JS 类必须 `setRootComponent(Component)` | §1.6 |
| `options.alias` | 打包期别名，值相对**工程根**解析（不是 src） | `libs/rollup.config.js:42-47`（`path.resolve(info.getAppRoot(), appMetaOptions.alias[key])`） |
| `options.style.lessPaths` | **Less `@import` 搜索路径**，默认 `['styles']`；解析为 `<appRoot>/src/<item>`，并强制追加 `<appRoot>/node_modules` | `libs/common.js:77-84`、`rollup-plugins/style-json.js:171` |
| `options.style.theme` | 解析 `node_modules/falcon-ui/src/styles/<theme>/theme.config.js` 成虚拟模块 `FALCON_THEME`；同时作为 Less `modifyVars.theme` 注入 | `libs/common.js:7-38,71-83` |
| `options.style.themeCustom` | 自定义主题目录，`<appRoot>/src/styles/<themeCustom>/`（`theme.config.js` 存在才生效） | `libs/common.js:23-36` |
| `options.style.themes` | 多主题数组（会为每个主题各编译一份样式 JSON）；样本均未用 | `rollup-plugins/falcon-vue.js:70-77` |
| `meta` / `props` | 会原样进 `manifest.json` | `steps/manifest.js:49-55` |
| `services` / `providers` | 额外构建入口（`services/<name>`、`providers/<name>`） | `libs/appinfo.js:261-295` |

别名的真实用法（dog 计算器为了避开 mathjs 的 `crypto` 依赖）——`doge-calculator-main/src/app.json:7-11`：

```json
"options": { "alias": { "crypto": "src/utils/mock.js" } }
```

### 1.4 `src/app.js`（最小可用）

dog 系原版（`doge-calculator-main/src/app.js:1-68`，与 doge-reader 逐字节相同）：

```js
import { BasePage } from './base-page.js'
class App extends $falcon.App {
  constructor() { super() }
  onLaunch(options) {
    super.onLaunch(options)
    // 屏幕分辨率适配机制:
    // 当 viewPort 设置750时, 所有元素尺寸可按照设计稿为 750px 宽度标准编写,
    // 最后系统会动态计算屏幕实际尺寸并显示.
    // this.setViewPort(750)

    // 设置页面基类,应用全局的$falcon.Page将被替换成此处指定的BasePage.
    // 继承自$falcon.Page的页面将继承自改基类.
    // 如页面未指定js,直接指向.vue文件,页面创建时会默认创建该类的实例
    $falcon.useDefaultBasePageClass(BasePage)
  }
  onShow() { super.onShow() }
  onHide() { super.onHide() }
  onDestroy() { super.onDestroy() }
}

try {
  globalThis['window'] = { requestAnimationFrame, cancelAnimationFrame }
} catch (err) { console.log(err) }

try {
  globalThis['process'] = { env: { NODE_ENV: 'production' } }
} catch (err) { console.log(err) }

export default App
```

PenBili 版（`PenBili-main/src/app.js:1-31`）——**显式 `setViewPort(800)`**：

```js
import { BasePage } from './base-page.js';

// 逻辑画布宽度来自设备 profile（profiles/youdao-x5.md，真机截屏证实）：
// 有道 X5 的 Falcon UI 合成面为横向条带 800x254，物理面板 254x800（direction=270）。
const DESIGN_WIDTH = 800;

class App extends $falcon.App {
  constructor() { super(); }
  onLaunch(options) {
    super.onLaunch(options);
    this.setViewPort(DESIGN_WIDTH);
    $falcon.useDefaultBasePageClass(BasePage);
  }
  onShow() { super.onShow(); }
  onHide() { super.onHide(); }
  onDestroy() { super.onDestroy(); }
}

export default App;
```

`setViewPort` 语义（`cli-libs/falcon-jsfm/dist/falcon-js-web.js:422-429`）：

```js
/**
 * 设置应用的viewPort
 * 如果设置了应用的viewPort,容器会根据viewPort和实际容器物理尺寸进行缩放
 */
setViewPort(viewPort) { this.viewPort = viewPort; }
```

> 实测结论：X5 上**不调用 setViewPort 时画布就是 800×254**（dog 系的 `vh` 数值可反证：`12vh+22vh+5vh = 39vh`，而 `doge-reader-main/src/pages/reader/reader.vue:105` 同时写 `viewportWidth: w - 0.39 * h`（`h = $falcon.env.deviceHeight`），两式在 `h=254` 时严格相等 → `1vh = 2.54px`）。PenBili 显式 `setViewPort(800)` 后 **px 与逻辑像素 1:1**，可直接写 800×254 的绝对坐标。

### 1.5 `src/base-page.js`（页面基类 / 资源回收）

两套实现，二选一。**PenBili 版更短更贴 X5**（`PenBili-main/src/base-page.js:1-96`，全文）：

```js
// 统一资源回收的页面基类（与 deepseek-x5 上真机验证过的实现一致）：
// 跟踪 $falcon.on token、timeout、interval，在 onUnload 的 finally 中释放。
class ResourcePage extends $falcon.Page {
  constructor() {
    super();
    this.falconOnTokens = [];
    this.timeoutTokens = new Set();
    this.intervalTokens = new Set();
  }

  on(name, callback) {
    const token = $falcon.on(name, callback);
    this.falconOnTokens.push([token, name]);
    return token;
  }
  off(name, callbackOrToken) {
    $falcon.off(name, callbackOrToken);
    this.falconOnTokens = this.falconOnTokens.filter((item) => item[0] !== callbackOrToken);
  }
  setTimeout(callback, delay) { const token = setTimeout(() => { this.timeoutTokens.delete(token); callback(); }, delay); this.timeoutTokens.add(token); return token; }
  clearTimeout(token) { clearTimeout(token); this.timeoutTokens.delete(token); }
  setInterval(callback, delay) { const token = setInterval(callback, delay); this.intervalTokens.add(token); return token; }
  clearInterval(token) { clearInterval(token); this.intervalTokens.delete(token); }
  sleep(delay) { return new Promise((resolve) => this.setTimeout(resolve, delay)); }

  release() {
    this.falconOnTokens.forEach((item) => $falcon.off(item[1], item[0]));
    this.falconOnTokens = [];
    this.timeoutTokens.forEach((token) => clearTimeout(token));
    this.intervalTokens.forEach((token) => clearInterval(token));
    this.timeoutTokens.clear();
    this.intervalTokens.clear();
  }
}

export class BasePage extends ResourcePage {
  onLoad(options) { super.onLoad(options); this.options = options || {}; }
  onNewOptions(options) { super.onNewOptions(options); this.options = options || {}; }

  onShow() { super.onShow(); if (this.$root && this.$root.onShow) this.$root.onShow(); }
  onHide() { super.onHide(); if (this.$root && this.$root.onHide) this.$root.onHide(); }

  onUnload() {
    try {
      super.onUnload();
      if (this.$root && this.$root.onUnload) this.$root.onUnload();
    } finally {
      this.release();
    }
  }

  beforeVueInstantiate(Vue) {
    if (super.beforeVueInstantiate) super.beforeVueInstantiate(Vue);
    Vue.prototype.$workspace = globalThis.$workspace;
    Vue.prototype.$appid = globalThis.$appid;
  }
}
```

dog 版（`doge-calculator-main/src/base-page.js:1-174`）多两个东西：`trigger(name, options)` 代理，和用 `$falcon.eventMap` 精确回收 token 的 `off()`（`_collectFalconEventIds`，`:2-16`）。

**生命周期契约**：页面 JS 类负责在 `onLoad` 里 `setRootComponent(...)`；`onShow/onHide/onUnload` 由基类转发给 Vue 根组件（`this.$root.onShow()`）。所以 **Vue 组件里的 `onShow/onHide/onUnload` 要写成 `methods`**（不是 Vue 的生命周期钩子）。

### 1.6 页面 JS 是可选的 —— 两种注册方式

**A. `pages: { "index": "pages/index/index.vue" }`（JS 省略）**
`$falcon.useDefaultBasePageClass(BasePage)` 之后，框架用该基类实例化页面并自动把 `.vue` 当根组件。dog 系 app.js 的注释即为此（`doge-calculator-main/src/app.js:21-24`）：

> 设置页面基类,应用全局的$falcon.Page将被替换成此处指定的BasePage. 继承自$falcon.Page的页面将继承自改基类. **如页面未指定js,直接指向.vue文件,页面创建时会默认创建该类的实例**

**B. `pages: { "index": "pages/index/index.js" }`（显式页面类）**
`PenBili-main/src/pages/index/index.js:1-19` 全文：

```js
import IndexComponent from './index.vue';
import { BasePage } from '../../base-page.js';

class PageIndex extends BasePage {
  constructor() { super(); }
  onLoad(options) { super.onLoad(options); this.setRootComponent(IndexComponent); }
  onNewOptions(options) { super.onNewOptions(options); }
}

export default PageIndex;
```

`setRootComponent` 只能调一次，必须在构造或 `onLoad` 内（`falcon-js-web.js:439-449`：`throw new Error('root component has set!')`）。

**运行时页面加载机制**（`rollup-plugins/app.js:41-69`）——这解释了产物里为什么有 `index.js.bin`、`diag.js.bin`：

```js
$falcon.__loadModuleDefault = async function (fileName) {
  if (App.__pages && App.__pages[fileName]) { return App.__pages[fileName]; }
  else {
    try {
      const pagePath = './' + fileName + '.js';
      let mod = await import(pagePath);
      return mod.default;
    } catch (e) { console.log(e.message, e.stack); }
  }
}
```

* `single-js-bundle: false` + 多页 → 每页一个 rollup entry，输出 `<页名>.js` → qjsc → `<页名>.js.bin`。
* `single-js-bundle: true`（或**只有 1 个页面**时自动为 true，`libs/appinfo.js:200-212`）→ `generatePagesImports()` 把每个页面静态 `import` 进 app.js，`App.__pages['name']` 直接命中。

### 1.7 一个最小可跑工程的完整清单

```
MyChat/
  package.json           # 见 §1.2，appid 换 16 位 800…；含 appName/icon/quickjs/single-js-bundle/scripts
  app_icon.png           # 256x256 RGBA PNG
  src/
    app.js               # 见 §1.4（PenBili 版，setViewPort(800)）
    app.json             # { "pages": { "index": "pages/index/index.vue" }, "options": { "style": { "lessPaths": ["styles"], "theme": "dark" } } }
    base-page.js         # 见 §1.5（PenBili 版）
    styles/var.less      # 见 §3.3
    styles/base.less     # 见 §3.4 / §4
    pages/index/index.vue# 见 §2.2
  libs/                  # 需要 native 时才建
```

> 注意 `theme` 值必须能在 `node_modules/falcon-ui/src/styles/<theme>/theme.config.js` 找到，否则构建期 warning「找不到theme "X"，请检查 falcon-ui 是否安装」（`libs/common.js:16`）。不装 `falcon-ui` 就**删掉 `theme` 字段**（默认 `theme-default` 同样会 warn）。

---

## 2. SFC 结构

### 2.1 一个 `.vue` 的三个块

`.vue` 由 falcon 的 `vue-template-compiler@2.6.12` / `falcon-template-compiler@2.6.12-falcon3` 解析（`cli-libs/index.js:3-8`；`cli-libs/vue/packages/vue-template-compiler/package.json`）。块顺序**任意**（`doge-reader-main/src/components/button-column.vue:1-20` 把 `<style>` 写在 `<script>` 前面也能跑），但样本统一 `template → script → style`。

### 2.2 页面模板（真实完整例：PenBili 首页骨架）

`PenBili-main/src/pages/index/index.vue:1-42`（截取，展示根元素与三栏结构）：

```html
<template>
  <div :class="mode === 'play' ? 'page page-live' : 'page'">
    <!-- 左侧栏：浏览态=选项栏，播放态=播放控制 -->
    <div class="bar">
      <text class="brand">PenBili</text>
      <template v-if="mode === 'browse'">
        <div v-for="t in tabs" :key="t.id" :class="tab === t.id ? 'tab tab-on' : 'tab'" @click="selectTab(t.id)">
          <text :class="tab === t.id ? 'tab-text tab-text-on' : 'tab-text'">{{ t.label }}</text>
        </div>
        <text class="bar-status">{{ statusText }}</text>
      </template>
      <template v-else> … </template>
    </div>

    <!-- 浏览内容 -->
    <div v-if="mode === 'browse'" class="content">
      <scroller v-if="tab === 'rcmd' || tab === 'hot'" class="list">
        <div v-for="it in currentItems" :key="it.bvid" class="vrow" @click="onPlayItem(it)">
          <image class="thumb" :src="it.cover" :width="112" :height="63"></image>
          <div class="vinfo">
            <text class="vtitle">{{ it.title }}</text>
            <text class="vmeta">{{ vmeta(it) }}</text>
          </div>
        </div>
        …
      </scroller>
```

**根元素约定**：一个普通 `<div>`，挂根类名（`.page` / `.container`），**尺寸在样式里写死 800×254**（PenBili）或 `width:100vw; height:100vh`（dog 系）。根上允许 `:class` 三元，允许 `<template v-if/v-else>` 包住整段 UI。

**结论：模板中所有文本都要包在 `<text>` 里**（`<div>` 里裸写文字不会被渲染成文本节点 —— 全样本零例外）。

### 2.3 `<script>` 的写法（dog 系 vs PenBili）

dog 系页面（`doge-reader-main/src/pages/index/index.vue:28-73`）：

```js
<script>
import ButtonColumn from "../../components/button-column.vue";
import HistoryCard from "../../components/history-card.vue";
import Storage from "../../utils/Storage/Storage.js";

const storage = new Storage();

export default {
    name: 'index',
    components: { MainButton, ButtonColumn, IconButton, HistoryCard },
    data() { return { history: [] } },
    computed: {
        historyList() { return this.history.slice(-2).reverse(); }
    },
    methods: {
        openLink(link) { $falcon.navTo(link); },
        back() { this.$page.finish(); },
        open(path, progress) { $falcon.navTo('reader', { path, progress: JSON.stringify(progress) }); },
        onShow() { storage.getAllItems().then(items => { this.history = items; }); }
    }
}
</script>
```

PenBili 页面（`PenBili-main/src/pages/index/index.vue:333-443`）：`name` / `data()` / `computed` / **`async created()`** / `methods`，并把 `onShow/onHide/onUnload` 放在 `methods` 末尾：

```js
export default {
  name: 'PageBili',
  data() { return { tabs: TABS, tab: 'rcmd', mode: 'browse', play: idlePlay(), … }; },
  computed: {
    currentItems() { return this.tab === 'hot' ? this.hotItems : this.rcmdItems; },
    btnText() { if (this.play.state === 'loading') return '…'; return this.play.state === 'paused' ? '开始' : '暂停'; },
    hasLogin() { return !!this.profile; }
  },
  async created() {
    this.gen = 0;
    this._timers = new Set();
    this.client = createClient({});
    await this.loadLocal();          // async created 合法
  },
  methods: {
    sleep(ms) { return new Promise((resolve) => { const t = setTimeout(() => { this._timers.delete(t); resolve(); }, ms); this._timers.add(t); }); },
    …
    onShow() { /* 回前台不自动联网 */ },
    onHide() { if (this.imBusy) { logWarn('[bili] onHide during IM session → skip teardown'); return; } this.teardown('已停止（切后台）'); },
    onUnload() { this.teardown(''); }
  }
};
```

页面间传参：`$falcon.navTo('reader', { path, progress })` → 目标页读 `this.$page.options.path`（`doge-reader-main/src/pages/reader/reader.vue:95,109-115`）。返回：`this.$page.finish()`。重入参数走 `onNewOptions`。

### 2.4 `<style lang="less" scoped>` —— 必写，且必须自己 `@import`

**这是硬性要求，源码级证据**（`aiot-vue-cli/src/rollup-plugins/falcon-vue.js:20-84`）：

```js
async function _transform(parts, id) {
  let scopeId = 'data-v-' + genId(path.relative(process.cwd(), id));
  let template = ''; if (parts.template) { … }
  let styleInfo = _createStyleString(parts.styles, id, scopeId);   // ← 关键
  let scriptString = _createScriptString(parts.script, id, scopeId, isFunctional);
  let code = `
${scriptString}
${styleInfo.importString}      // ← 每个 <style> 块生成一条 import
${template}
…
_exports.style = ${styleInfo.styleString ? styleInfo.styleString :
  (styleInfo.themesString ? "_exports.themes['_']" : "{}")};   // ← 无 style 块 ⇒ {}
…
`;
}

function _createStyleString(styles, fileName, scopeId) {
  …
  if (!styles || styles.length === 0) {
    return { importString: '', styleTarget: '{}' };    // ★ 什么都不生成
  }
  let importString = '';
  let styleNames = [];
  styles.forEach((style, index) => {
    importString += `import style_${index} from '${path.basename(fileName)}?scopeId=${scopeId}&${PACKAGE_NAME}=styles.${index}.${style.lang ? style.lang : 'css'}'\n`;
    styleNames.push(`style_${index}`);
  });
  …styleString = `Object.assign({}, ${styleNames.map(item => `${item}['_']`).join(' ,')})`
}
```

**结论 / 因果链**：
* 没有 `<style>` 块 ⇒ `importString === ''` ⇒ 该 `.vue` 的样式模块**根本没被 import** ⇒ `_exports.style = {}`。
* 页面组件没有样式 ⇒ 元素只有框架默认样式（`div` 是 column flex、无尺寸；`text` 默认 32px）⇒ 真机表现就是**整页黑/空白**。
* **`scoped` 与否不改变这条规则**；样本 100% 写 `lang="less" scoped`。`scoped` 的实现只是给元素加 `data-v-<8位hash>` 属性（`falcon-vue.js:34,39`；runtime `index.common.js:8575-8602`），**选择器本身不做后缀改写**（所以「只有单类选择器」这条约束不会被 scoped 破坏）。
* 真机反面证据（`PenBili-main/profiles/youdao-x5.md:232-234`）：

  > 1. **`.vue` 必须自带 `<style lang="less" scoped>` 块**：无 style 块时样式规则完全不进 bundle（`app.js.bin` 里无 `#0e1116`/`348px`）→ 页面全黑；`app.json` 的 `lessPaths` 只是 `@import` 搜索路径，**不是全局注入**。

样本里把这件事写进注释当铁律（`PenBili-main/src/styles/base.less:6-7`、`src/pages/diag/diag.vue:224-226`）：

```less
// 铁律：每个 .vue 必须自带 <style lang="less" scoped> 并 @import 本文件——
//       没有 style 块时样式规则不会进 bundle（2026-09-22 真机黑屏证据）。
```

```html
<style lang="less" scoped>
/* 样式必须以 <style> 块形式存在于 .vue 内（真机证据：无 style 块时
   规则完全不进 bundle → 页面全黑）。自检页样式独立在 diag.less。 */
@import "../../styles/diag.less";
</style>
```

**最小可用写法**（页面自己带样式，不依赖共享文件）：

```html
<style lang="less" scoped>
.chat-page {
  width: 800px; height: 254px;
  flex-direction: row;
  background-color: #0e1116;
}
</style>
```

**每个 `.vue` 模板**（可直接复制起手）：

```html
<template>
  <div class="page"><text class="title">Hello</text></div>
</template>

<script>
export default {
  name: 'PageName',
  data() { return {}; },
  methods: {}
};
</script>

<style lang="less" scoped>
@import "../../styles/base.less";
</style>
```

---

## 3. Less 约定

### 3.1 编译管线（三个事实）

1. `<style lang="less">` 的内容被当作 Less 源码，由 `rollup-plugins/style-json.js:135-155` 编译：

```js
async function style2JSON_One(code, id, lessModifyVars, lessPaths) {
  switch (path.extname(id)) {
    case '.less':
      const result = await less.render(code, { modifyVars: lessModifyVars, paths: lessPaths });
      cssCode = result.css; break;
    …
  }
  return await genStyleString(id, cssCode);   // → JSON 样式表
}
```

2. `lessPaths` 由 `libs/common.js:77-84` 生成，**只是搜索路径**：

```js
function getLessPaths(styleOpts) {
  let lessPaths = styleOpts['lessPaths'] || ['styles'];
  lessPaths = lessPaths.map(item => path.resolve(appInfo.getAppRoot(), 'src', item));
  lessPaths.push(path.join(appInfo.getAppRoot(), 'node_modules'));
  return lessPaths;
}
```
调用处还额外把当前 `.vue` 所在目录放进 paths（`style-json.js:171`）：
```js
const lessPaths = [path.dirname(id), ...getLessPaths(tmpStyleOpts)]
```
⇒ **`@import "var.less";`（不带路径）能命中，是因为 `<appRoot>/src/styles` 在搜索路径里；但它绝不会自动注入到你的页面。** 每个 `.vue` 都要自己 `@import`。

3. Less 变量 `@theme` / `@themeCustom` 被 `modifyVars` 注入（`libs/common.js:71-75`），可用于条件化主题 Less。

### 3.2 `var.less` 样例（PenBili，10 行，`PenBili-main/src/styles/var.less:1-10`）

```less
// 主题变量：只使用本项目自定义变量，不依赖 falcon-ui 主题（避免主题版本差异）
@background-color: #0e1116;
@card-background-color: #1b2027;
@card-border-color: #2a323b;
@text-color: #e9eef4;
@text-color-dim: #8d99a6;
@accent: #3ea6ff;
@accent-dim: #1d4a70;
@danger: #ff6b6b;
@progress-track: #2a323b;
```

**命名约定**：`@<角色>-<修饰>`，角色名沿用 CSS 语义（`background-color` / `text-color` / `card-background-color` / `accent` / `accent-dim` / `danger`）。dog 系用 Material 3 命名（`doge-reader-main/src/styles/md-color.less:1-9`）：

```less
@primary: #004a77;  @on-primary: #c2e7ff;
@neutral: #1a1b1f;  @on-neutral: #e3e3e3;
@secondary: #7a0f1c; @on-secondary: #ffd6db;
@link: #0842a0;  @surface: #080a0c;  @outline: #8e918f;
```

（dog 计算器版本是它的子集：`doge-calculator-main/src/styles/md-color.less:1-4`，`@on-primary:#e3e3e3; @primary:#1a1b1f; @link:#0842a0; @neutral:#8e918f;`）

### 3.3 色板总表（样本实际用到的十六进制值）

| 用途 | PenBili（深色） | dog 系（M3 深色） |
|---|---|---|
| 页面底 | `#0e1116` | `@surface #080a0c` / `@neutral #1a1b1f` |
| 卡片/侧栏底 | `#1b2027` | `@primary #004a77`（主按钮）、`@neutral #1a1b1f`（次级） |
| 卡片描边/分隔 | `#2a323b` | `@outline #8e918f` |
| 主文本 | `#e9eef4` | `@on-neutral #e3e3e3` / `@on-primary #c2e7ff` |
| 次文本/暗 | `#8d99a6` | `@outline #8e918f` |
| 强调（链接/高亮） | `#3ea6ff` | `@link #0842a0` |
| 强调底（按钮） | `#1d4a70` | `@primary #004a77` |
| 危险 | `#ff6b6b` | `@secondary #7a0f1c` |
| 成功/OK 文本 | `#4caf7d`（`styles/diag.less:108-110`） | — |
| 按钮文字（深底上） | `#ffffff` | `@on-primary #c2e7ff` |
| 输入/关键词文字 | `#ffffff`（`.ctrl-text`/`.search-btn-text`） | — |
| 计算器成功/错误文本 | — | `#6dd58c` / `#f2b8b5`（`doge-calculator-main/src/pages/index/index.vue:36-40`） |
| 二维码白底/黑块 | `#ffffff` / `#000000`（`base.less:453,467-469`） | — |
| 遮罩 | `rgba(0,0,0,0.4)`（`components/drawer.vue:54`） | — |
| 透明（挖洞） | `rgba(0, 0, 0, 0)`（`base.less:22,344`） | — |

### 3.4 `base.less` 的写法与规模

* **PenBili `src/styles/base.less` = 756 行**：`@import "var.less";`（:1）+ 全部页面的扁平单类（`.page/.bar/.tab/.content/.vrow/.thumb/.vinfo/.vtitle/.mine-*/.search*/.play-*/.info-*/.comments-*/.reply-*`）+ 末尾 `qr-l-1..65` 宽度表（:692-756，用 `:class="'qr-seg ' + seg.cls"` 驱动，**零 inline style**）。
* **dog 系 `common.less`** 提供的是通用原子类（`doge-reader-main/src/styles/common.less:1-32`）：

```less
@import 'md-color.less';

.container { width: 100vw; height: 100vh; flex-direction: row; }
.title     { margin-top: 10vh; margin-bottom: 8vh; color: @outline; font-size: 12vh; line-height: 15vh; }
.loading   { font-size: 12vh; text-align: center; color: @outline; }
.link      { margin: 0 1vh; color: @link; font-size: 10vh; text-decoration: underline; }
.link:active { opacity: 0.6; }
```

* **`scoped` 与共享文件的配合**：`base.less` 里的类名是「全局命名空间」——因为样式表是按**类名**索引的扁平 map，多个 `.vue` `@import` 同一份 `base.less` 只是各拿一份副本（`Object.assign({}, style_0['_'])`），不会互相覆盖；但同一组件内**同名类后者覆盖前者**（`base.less:158` 注释：「定义在 .thumb 之后 → 尺寸后者生效」）。**不要在不同语义上复用同一个类名**。
* dog 计算器 `common.less` 额外定义了 `.scroller { flex: 1; height: 100vh; }`（`doge-calculator-main/src/styles/common.less:3-6`）——这就是 dog 全系列给 `<scroller>` 的默认铺满类。

---

## 4. 800×254 横向画布布局

### 4.1 坐标系与两条技术路线

| | PenBili 路线 | dog 路线 |
|---|---|---|
| 单位 | **绝对 px**（`setViewPort(800)`） | **`vh/vw` 相对单位**（不调 setViewPort） |
| 画布 | 800×254 写死 | `100vw`=800px、`100vh`=254px |
| 换算 | 1px = 1 逻辑像素 | `1vh = 2.54px`、`1vw = 8px` |
| 优点 | 与截图/像素证据一一对应，好对齐 | 天然适配其它机型（A7 pro 1024×240、S6 pro 560×170 见 dog README） |
| 缺点 | 换机型要改数 | 数字要心算 |

> dog 的换算证明（严谨）：`doge-reader-main/src/pages/reader/reader.vue:57-59,105`
> `const h = $falcon.env.deviceHeight;` … `viewportWidth: w - 0.39 * h`；
> 而 `components/button-column.vue:9-13` 的列宽 = `padding 12vh + 内容 22vh + padding 5vh = 39vh`；
> 两式相等 ⇒ `39vh = 0.39 × 254` ⇒ `1vh = 2.54px`（`env.deviceWidth=800`, `env.deviceHeight=254`）。

**给新工程的建议**：用 PenBili 路线（`setViewPort(800)` + px），并在 `base.less` 里放一层换算注释（`10px ≈ 4vh`），因为 AI 聊天界面的气泡/列表需要精确控制换行宽度。

### 4.2 元素默认值（不写就等于这些）

来自框架注入的基础样式表（`falcon-vue-render/dist/index.common.js:40` 内联的 CSS，已提取到 `_amr_probe/falcon-base.css`）：

```css
.weex-ct   /* 所有 <div> */ {
  box-sizing: border-box; display: flex;
  flex-direction: column;      /* ★ 默认竖排 */
  flex-shrink: 0; flex-grow: 0; flex-basis: auto;
  align-items: stretch; align-content: flex-start;
  border: 0 solid black; margin: 0; padding: 0; min-width: 0;
}
.weex-el   /* text/image 等 */ { display: block; box-sizing: border-box; flex-shrink: 0; … }
.weex-text /* 所有 <text> */ {
  -webkit-box-orient: vertical; white-space: pre-wrap;   /* 自动换行 */
  font-size: 0.4266666666666667rem;                      /* ★≈32 设计px，必须显式覆盖 */
  word-wrap: break-word; overflow: hidden;               /* 高度不够就裁掉 */
}
.weex-image { background-repeat: no-repeat; background-position: 50% 50%; background-size: 100% 100%; }
```
（`.` 号前缀的类不会与你的类冲突；`div.weex-root { min-height: 100% }`、`.weex-root { width: 100% }`。）

### 4.3 可直接抄的数字表（PenBili 实测值）

**整体骨架**（`PenBili-main/src/styles/base.less:10-15,26-35,126-136`）：

| 区块 | 尺寸 | 说明 |
|---|---|---|
| `.page` | `800×254`, `flex-direction: row`, 底 `#0e1116` | 根 |
| `.bar`（左栏） | `174×254`, column, padding `6px 8px`, 底 `#1b2027` | 浏览态=标签栏 / 播放态=控制栏 |
| `.content`（右侧） | `626×254`, column | 626 = 800 − 174 |
| `.play-col`（视频列） | `452×254` | 16:9 信箱适配 800×254 的宽度 |
| `.info-col`（播放信息列） | `174×254`, padding 8 | 452 + 174 = 626 |
| `.comments-col`（评论浮层） | `626×254`, padding `2px 8px` | 不透明盖住内容区 |

**左栏控件**（`base.less:37-123`）：

| 类 | 数值 |
|---|---|
| `.brand` | `height:24px; font-size:16px` |
| `.tab` | `158×40`, `margin-top:4px`, `border-radius:6px`, 居中 |
| `.tab-text` | `font-size:15px` |
| `.ctrl` | `158×34`, `margin-top:6px`, `radius:6px` |
| `.ctrl-text` | `font-size:14px; color:#fff` |
| `.ctrl-half` | `width:76px`（一行两个 + `justify-content: space-between`） |
| `.bar-time` | `font-size:16px; color:@accent` |
| `.bar-state` | `font-size:11px; lines:3; text-overflow:ellipsis` |

**列表行/其它**：

| 类 | 数值 | 行 |
|---|---|---|
| `.vrow`（视频行） | `626×72`, row, `align-items:center`, padding 左右 8 | `base.less:138-149` |
| `.thumb` | `112×63`, `radius:4px` | `:151-156` |
| `.vtitle` | `14px`, `lines:2`, ellipsis | `:170-175` |
| `.vmeta` | `12px`, `margin-top:4px`, `lines:1` | `:177-183` |
| `.more-row` / `.more-half` | `610×40` / `297×40`, `radius:8px` | `:312-329` |
| `.mine-row` | `610×40`, `margin-left:8px`, `radius:8px`, padding 左右 12 | `:237-248` |
| `.searchbar` | `610×44`, `radius:8px` | `:269-281` |
| `.search-btn` | `64×32`, `radius:6px` | `:292-299` |
| `.comments-head` | `610×32` | `:545-550` |
| `.comments-close` | `width:96px`（复用 `.ctrl` 高 34） | `:559-561` |
| `.reply-write` | `142×28`, `radius:6px` | `:593-600` |
| `.reply-item` | padding 6, `radius:6px`, `margin-top:6px` | `:617-623` |
| `.reply-name/.reply-msg/.reply-meta` | `11px lines:1` / `11px lines:3` / `10px lines:1` | `:646-666` |
| `.avatar` | `40×40`, `radius:20px` | `:411-417` |
| `.qr-box` | `228×228`, `radius:8px`, 白底 | `:445-456` |
| `.qr-row/.qr-seg` | `height:4px` | `:458-465` |

**自检页局部**（`PenBili-main/src/styles/diag.less`，另一种信息密度）：

| 类 | 数值 | 行 |
|---|---|---|
| `.panel` | `348×254`, padding `6px 8px 6px 10px` | `:38-46` |
| `.head` | `height:22px` | `:48-52` |
| `.row` | `height:21px` | `:71-75` |
| `.glyph/.label/.detail` | `w16 13px` / `w74 13px` / `flex1 12px` | `:77-97` |
| `.foot` | `height:30px`, `margin-top:4px` | `:132-137` |
| `.btn` | `72×28`, `radius:6px` | `:147-155` |
| `.btn-text` | `width:72px; font-size:14px; text-align:center` | `:161-166` |

**触控目标尺寸汇总**（这块屏只有 254 高，样本的实际取值）：

* 侧栏图标按钮：**55.9×55.9px**（dog `22vh`，`components/icon-button.vue:19-26`）
* 主按钮（dog 首页两大卡）：`flex:1` × 剩余高度（`main-button.vue:20-24`）
* 卡片行最小高：**76px**（dog `30vh`，`history-card.vue:22`）
* 开关：**81×46px**（dog `32vh × 18vh`，`components/toggle.vue:31-35`）
* 翻页大按钮：高 **61px**（dog `24vh`，`page-turning-button.vue:22`）
* PenBili 列表行 **40px**、标签 **40px**、控制键 **34px**、小按钮 **28px**、评论卡片区 padding 6

> 结论：**主交互目标 ≥ 40px 高，次要 ≥ 28px 高，绝不低于 24px**。40px 是本平台事实上的「舒适下限」（254 / 40 ≈ 6.3 行）。

### 4.4 三份完整页面布局（真实代码）

#### 例 1：PenBili 浏览态 —— 174px 侧栏 + 626px 滚动列表

模板（`PenBili-main/src/pages/index/index.vue:2-60`，见 §2.2）+ 样式：

```less
/* PenBili-main/src/styles/base.less:10-15, 26-35, 44-70, 126-183 */
.page {
  width: 800px; height: 254px;
  flex-direction: row;
  background-color: @background-color;      /* #0e1116 */
}
.bar {
  width: 174px; height: 254px;
  flex-direction: column;
  padding-left: 8px; padding-right: 8px; padding-top: 6px; padding-bottom: 6px;
  background-color: @card-background-color; /* #1b2027 */
}
.brand { height: 24px; font-size: 16px; color: @accent; lines: 1; }
.tab {
  width: 158px; height: 40px; margin-top: 4px; border-radius: 6px;
  justify-content: center; align-items: center;
  background-color: @background-color;
}
.tab-on { background-color: @accent-dim; }
.tab-text { font-size: 15px; color: @text-color-dim; text-align: center; }
.tab-text-on { color: #ffffff; }
.tab:active { opacity: 0.7; }
.bar-status { margin-top: 6px; flex: 1; font-size: 11px; color: @text-color-dim; lines: 4; text-overflow: ellipsis; }

.content { width: 626px; height: 254px; flex-direction: column; }
.list    { width: 626px; height: 254px; flex-direction: column; }
.vrow {
  width: 626px; height: 72px; flex-direction: row; align-items: center;
  padding-left: 8px; padding-right: 8px;
}
.vrow:active { opacity: 0.7; }
.thumb { width: 112px; height: 63px; border-radius: 4px; background-color: @card-border-color; }
.vinfo { flex: 1; margin-left: 10px; flex-direction: column; }
.vtitle { font-size: 14px; color: @text-color; lines: 2; text-overflow: ellipsis; }
.vmeta  { margin-top: 4px; font-size: 12px; color: @text-color-dim; lines: 1; text-overflow: ellipsis; }
```

要点：**左栏固定宽 + 右栏 flex 列表**；列表整体交给 `<scroller class="list">`（`height:254px` 铺满）；一行 = 图 112×63 + 文本列，行高 72。

#### 例 2：PenBili 播放态 —— 452 视频洞 + 174 信息列

```less
/* PenBili-main/src/styles/base.less:336-403 */
.play-col { width: 452px; height: 254px; }
.video-hole { width: 452px; height: 254px; background-color: rgba(0, 0, 0, 0); }
.info-col {
  width: 174px; height: 254px; flex-direction: column;
  padding: 8px; background-color: @card-background-color;
}
.info-title { font-size: 14px; color: @text-color; lines: 4; text-overflow: ellipsis; }
.info-up    { margin-top: 4px; font-size: 12px; color: @text-color-dim; lines: 1; text-overflow: ellipsis; }
.info-spacer { flex: 1; }                     /* 把下面的元素压到底部 */
.info-state { margin-top: 4px; font-size: 12px; color: @text-color-dim; lines: 3; text-overflow: ellipsis; }
.info-ctrl {
  width: 158px; height: 34px; margin-top: 4px; border-radius: 6px;
  background-color: @background-color;
  justify-content: center; align-items: center;   /* 容器双轴居中，文案变长也不偏 */
}
```

#### 例 3：dog 阅读器首页 —— `vh` 版「左按钮列 + 右侧卡片区」

模板（`doge-reader-main/src/pages/index/index.vue:1-26`，见前）+ 样式（`:75-102`）：

```less
@import "../../styles/common.less";
@import "../../styles/md-color.less";

.title-area {
    margin-right: 6vh;              /* 15.2px */
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
}
.content {
    flex: 1;
    margin-right: 6vh;
    flex-direction: row;            /* 卡片区 | 两个大按钮 并排 */
}
.cards-area { flex: 2; justify-content: space-between; padding-bottom: 3vh; }
.main-button { flex: 1; margin-left: 7vh; }   /* 17.8px */
```

其中 `<ButtonColumn>`（左轨，宽 39vh=99px，`components/button-column.vue:8-13`）：

```less
.wrapper {
    height: 100vh;
    padding: 7vh 12vh 7vh 5vh;      /* 上 17.8 / 右 30.5 / 下 17.8 / 左 12.7 */
    flex-direction: column;
    justify-content: space-between; /* 图标按钮沿竖直方向均匀推开 */
}
```

#### 例 4：dog 计算器 —— 上 30% 显示区 + 下 70% 键盘

`doge-calculator-main/src/pages/index/index.vue:1-28`（模板）+ `:100-136`（样式）：

```less
.display {
    width: 100vw; height: 30vh;           /* 800 × 76.2 */
    padding: 2.5vh 0 0 5vh;
    align-items: center; justify-content: space-between; flex-direction: row;
}
.display-text { font-size: 15vh; text-align: right; lines: 1; }   /* 38.1px */
.keyboard { height: 70vh; }                                        /* 177.8 */
.line { flex: 1; flex-direction: row; }   /* 3 行 × 每个按键 flex:1 */
.buttons { flex-direction: row; margin-right: 5vh; }
```

按键组件（`components/button.vue:20-39`）：`.wrapper{flex:1}` → `.button{flex:1; margin:1.5vh; border-radius:5vh; justify-content:center; align-items:center}`，等号键用 `:style="{ flex: 2 }"` 拉宽（模板 `:24`）。

---

## 5. 可复用组件清单

### 5.1 `doge-reader-main/src/components/`（12 个，全部含 `<style lang="less" scoped>`）

| 文件 | 名称 | props | 用途 | 抄？ |
|---|---|---|---|---|
| `button-column.vue` | ButtonColumn | —（默认 slot） | 左侧竖直图标栏，`justify-content: space-between` | ★抄（聊天 App 的左轨导航） |
| `icon-button.vue` | IconButton | `icon:String*` | 56×56 圆角图标按钮 | ★抄 |
| `primary-icon-button.vue` | PrimaryIconButton | `icon:String*` | 同上但底为 `@primary`（选中态） | ★抄（配 IconButton 做 active 态） |
| `main-button.vue` | MainButton | `text:String*`, `icon:String*`, `color:Array*`（`[bg, fg]`） | 大卡片按钮（图标 + 文案，`flex:1`） | ★抄 |
| `menu-card.vue` | MenuCard | `text:String*`, `active:Boolean=false` | 列表项卡片，`active` → 高亮底 | ★抄（会话列表项） |
| `history-card.vue` | HistoryCard | `name:String*`, `time:String*` | 一行：标题 + 右侧时间 | ★抄 |
| `file-card.vue` | FileCard | `node:Object*` | 图标 + 名称行（`node.isDirectory()` 决定图标） | 参考 |
| `setting-card.vue` | SettingCard | `item:String*`, `desc:String*` + 默认 slot | 设置行：标题/描述 + 右侧开关 slot | ★抄（设置页） |
| `toggle.vue` | Toggle | `defaultValue:Boolean=false`；`$emit('click', checked)` | 自绘开关（track 12vh + thumb 16vh，`transition`） | ★抄 |
| `drawer.vue` | Drawer | —（默认 slot） | 右侧抽屉：`position:fixed` 全屏 + `.mask` 遮罩 + `transform:translateX(100%)` → `0`，`transition 0.3s`；靠 `$falcon.on('drawer')` 打开 | ★抄（侧边会话/设置抽屉） |
| `toast.vue` | Toast | — | 底部吐司：`position:fixed; bottom:0; translateY(100%)→0`；靠 `$falcon.on('toast')` 触发 | ★抄 |
| `page-turning-button.vue` | PageTurningButton | `text:String*`, `icon:String*` | 横向「图标+文字」大按钮 | 参考 |

drawer/toast 的全局事件写法（`components/drawer.vue:18-33`、`components/toast.vue:16-31`）——`$falcon` 事件负载是 `{type, timestamp, data}`（`falcon-js-web.js:334-349`），所以取 `e.data.show` / `e.data.text`：

```js
created() {
  this.onToast = (e) => { this.text = e.data.text; this.show = true; setTimeout(() => { this.show = false; }, 1000); };
  $falcon.on('toast', this.onToast);
},
beforeDestroy() { $falcon.off('toast', this.onToast); }
```
触发端：`$falcon.trigger('toast', { text: '书签已保存' })`（`pages/reader/reader.vue:135`）、`$falcon.trigger('drawer', { show: true })`（`:153`）。

### 5.2 `doge-calculator-main/src/components/`（4 个）

`button-column.vue`（同名前者的精简版，`min-width:33vh`）、`button.vue`（计算器按键：`text/expr/color`）、`icon-button.vue`（比 reader 版多一个 `color:String='#1a1b1f'`）、`info-card.vue`（`item/value` 两列信息卡）。

### 5.3 PenBili：**0 个自定义组件**

`PenBili-main/src/` 下**没有 `components/` 目录**：全部 UI 写在 `pages/index/index.vue`（1596 行）+ `pages/diag/diag.vue`（227 行）里，复用靠 `styles/base.less` 的扁平单类。这是本平台的一个务实选择（类名即组件），但聊天 App 更该学 dog 拆组件——因为**样式是按类名索引的扁平表，组件化不会有额外成本**。

### 5.4 `doge-comic-main/src/components/`（14 个，比 doge-reader 多 4 个 —— 补 doge 系的缺口）

与前作同名同构的有 `button-column / drawer / icon-button / info-card / page-turning-button / primary-icon-button / setting-card / toast / toggle`。新增/不同：

| 文件 | 名称 | props / 事件 | 用途 | 抄？ |
|---|---|---|---|---|
| `seekbar-card.vue` | SeekbarCard | `text*`, `min=0`, `max=100`, `step=1`, `value=0`, `scale=1`；`$emit('change', e)`；内部 `@changing` 更新 `e.detail.value` | **卡片 + 原生 `<seekbar>`**（拖动条），带数值显示 | ★★ 强烈推荐（AI 参数调节/进度） |
| `index-button.vue` | IndexButton | `text*`, `icon*` | 横向「图标 + 文字」列表卡（`height:30vh`，`:active` 变暗） | ★抄 |
| `comic-card.vue` | ComicCard | 见文件 | 带缩略图的卡片 | ★抄 |
| `history-card.vue` | HistoryCard | `node:Object*`, `time:String*` | **带 30vh 缩略图的历史卡**：`created()` 里用 `fs.readdir` 找目录首图，拼 `file://` 当封面 | ★★（聊天里显示本地图片附件） |

`seekbar-card.vue:1-11` 的关键写法（原生 seekbar 的 props 与事件）：

```html
<seekbar class="seekbar" :min="min" :max="max" :step="step" :value="value" active-color="#004a77"
    background-color="#8e918f" handle-color="#e3e3e3" :track-size="0.03 * vh" :handle-size="0.12 * vh"
    @change="onChange" @changing="onChanging" />
```
```js
data() { return { vh: $falcon.env.deviceHeight, value: null } },   // 用设备高度做尺寸基准
methods: {
    onChange(e) { this.$emit('change', e); },
    onChanging(e) { this.value = e.detail.value; }                 // ★ 事件负载：e.detail.value
}
```
`reader.vue:45-48` 的用法（注意 `scale` 做显示换算）：
```html
<SeekbarCard min="1" :max="reader.getSegmentCount()" step="1" :value="reader.index + 1" @change="onProgressChange" text="阅读分片" />
<SeekbarCard min="5" max="20" step="1" :value="reader.scale * 10" scale="0.1" @change="onScaleChange" text="图片缩放" />
```

### 5.5 `falcon-ui@1.0.3`（`node_modules/falcon-ui/src/`）

一个完整的类 Weex 组件库，**样本只把它当主题变量来源，没有 import 任何组件**。若要直接用：

| 导出 | 文件 | 关键 props |
|---|---|---|
| `Toast` | `packages/toast/index.vue` | `position: 'top'\|'middle'\|'bottom'`, `maxWidth`, `minHeight`；方法 `show(options)` / `hide()` |
| `FlRow` / `FlCol` | `packages/layout/{row,col}.vue` | 栅格 |
| `FlIcon` | `packages/icon/index.vue` | `name`（字体图标，依赖 `falcon-icons` 字体） |
| `FlButton` | `packages/button/index.vue` | `size(large/medium/normal/small/mini)`, `type(default/primary/…)`, `plain`, `round`, `disabled`, `icon`, `iconRight`；`$emit('click', {event,type})` |
| `FlCheckbox` / `FlSwitch` / `FlRadio` | `packages/*/index.vue` | 表单类 |
| `FlSeekbar` | `packages/seekbar/index.vue`（18KB） | 进度/拖动条 |
| `FlProgress` | `packages/progress/index.vue` | `percent`, `strokeColor`, `strokeRadius`, `transition` |
| `FlDialog` / `FlPopup` / `FlModalInternal` | 弹窗类 | — |
| `FlBarcode` / `FlQrcode` | 码类（自带 jsbarcode/qrcode.js） | ★二维码可用（PenBili 自己手写实现，因为要零 inline style） |
| `FlRichText` | `packages/rich-text/index.js` | 富文本 |
| `FlLottie` | `packages/lottie/index.vue` | Lottie 动画（21 万字节） |
| `FlSlider` / `FlImage` | | `FlImage` props: `src`, `resize(contain/cover/stretch/…)`, `width`, `height`；`$emit('onImageLoad', event)` |

**警告**：falcon-ui 的尺寸体系是给大屏的 —— `theme-dark/globals/theme.variables.less:1-51` 里 `@font-size-title-large:36px`、`@radius-normal:24px`、`@space-loose:32px`；`theme-dark/theme.config.js` 里 `switch {width:86px;height:48px}`、`radioSize:44px`。**在 254px 高的条带上直接拿来当 UI 会过大**，建议只取色板/字号梯度作参考，或明确按比例缩。

falcon-ui 的色板（`styles/globals/variables.less:5-28`）：`@red #EF4141 / @orange #FF6A00 / @yellow #FF9500 / @green #2D901E / @cyan #209AAD / @blue #376FDB / @purple #893FCD / @light-green #7CFF00` + gray-100..900（`#f8f9fa … #212529`）。其 dark 主题（`styles/theme-dark/globals/theme.variables.less:1-15`）：`@primary #FF6A00`、`@background-color #202731`、`@card-background-color #343F50`、`@secondary #48586F`、`@btn-background-color #778AA7`。

---

## 6. 滚动：什么真的能用

### 6.1 `overflow` 不能滚（硬约束）

样式白名单（`aiot-vue-cli/cli-libs/falcon-styler/lib/validator.js:645-759`）：

```js
boxModel: {
  …
  overflow: genEnumValidator(['visible', 'hidden']),   // ★ 只有这两个值
  display:  genEnumValidator(['flex']),                // ★ 只有 flex
  …
}
```
任何不在白名单的声明会被**丢弃并打 warning**（`falcon-styler/index.js:80-92`：`validateItem(camelCasedName, value)` 返回非 number/string 就不写入 JSON）。

### 6.2 正确做法：`<scroller>` 组件

`<scroller>` 是框架注册的原生组件（`web-libs/falcon-vue-precompiler/src/config.js:24-41`）：

```js
weexRegisteredComponents: [
  'input', 'switch', 'list', 'scroller', 'waterfall', 'header', 'loading', 'refresh',
  'loading-indicator', 'slider', 'cycleslider', 'slider-neighbor', 'indicator',
  'textarea', 'video', 'web'
],
```

可用 props（`falcon-vue-render/dist/index.common.js:6195-6214` 的 scrollable mixin + 样本用法）：

| prop | 类型/默认 | 说明 |
|---|---|---|
| `scroll-direction` | `'vertical'`(默认) / `'horizontal'` | 轴向 |
| `show-scrollbar` | `true` / `false` | 是否显示滚动条 |
| `over-scroll` | 长度，样本统一 `"50px"` | 越界回弹距离（iOS 风格）。`show-scrollbar`/`over-scroll`/`over-fling` 由运行时/native 消费 |
| `over-fling` | 长度，样本统一 `"50px"` | 惯性越界 |
| `loadmoreoffset` | Number，默认 0 | 触底加载偏移 |
| `offset-accuracy` | Number，默认 **10** | ★ `@scroll` 触发阈值：位移 ≥ 该值才派发一次（内部再节流 16ms） |

真实用例（`doge-reader-main/src/pages/setting/setting.vue:6-17`）：

```html
<scroller style="flex: 1;" show-scrollbar="false" over-scroll="50px" over-fling="50px">
  <text class="title">设置</text>
  <SettingCard class="card" item="启用滚动翻页" desc="在阅读界面通过上下滚动浏览整个章节">
    <Toggle v-if="!loading" :defaultValue="isScroll" @click="switchMode" />
  </SettingCard>
  …
</scroller>
```

横滚（`doge-calculator-main/src/pages/index/index.vue:6-15`）——**长算式横向滚动**：

```html
<scroller scroll-direction="horizontal" show-scrollbar="false" v-else class="display">
  <div class="buttons">
    <IconButton style="margin-right: 5vh;" :icon="require('../../assets/back.png?base64')" @click="back" />
    <IconButton :icon="require('../../assets/info.png?base64')" @click="openInfo" />
  </div>
  <div style="flex-direction: row;">
    <text :style="{ color: textColor }" class="display-text">{{ display }}</text>
    <div style="margin-right: 7vh;" ref="end" />   <!-- ★ 尾部锚点，用于 scrollToElement -->
  </div>
</scroller>
```

### 6.3 `@scroll`：事件确实有，负载形状如下

* 绑定：`@scroll` 会被编译器映射为原生事件 `weex$scroll`（`config.js:18-22`）：

```js
const config = {
  eventMap: { click: 'weex$tap', scroll: 'weex$scroll' },
  …
```
（`hooks/events.js:140-143`：`if (evts.scroll && !isCustomComponent) { evts['weex$scroll'] = evts.scroll; delete evts.scroll; }`）

* **负载**（`falcon-vue-render/dist/index.common.js:6161-6184`）：

```js
function triggerScroll () {
  var rect = inner.getBoundingClientRect();
  var evtObj = {
    contentSize: { width: rect.width, height: rect.height },
    contentOffset: {
      x: wrapper.scrollLeft,
      /** positive direciton for y-axis is down. so should use negative operation on scrollTop. */
      y: -wrapper.scrollTop
    }
  };
  if (context.$el) { weex.utils.dispatchNativeEvent(context.$el, 'weex$scroll', evtObj); }
}
if (Math.abs(offset - preOffset) >= indent) { triggerScroll(); preOffset = offset; }
```
⇒ **`event.contentOffset.y` / `event.contentOffset.x` / `event.contentSize`**，`y` 向下为正（内部对 `scrollTop` 取负）。

* 样本里的真实读写（`doge-reader-main/src/pages/reader/reader.vue:17,163-166`）：

```html
<scroller style="flex: 1;" @scroll="setOffsetY" v-else-if="reader.mode === 'scroll'" over-scroll="50px" over-fling="50px">
```
```js
setOffsetY(event) {
    if (this.reader.mode !== 'scroll' || !this.isListeningScroll) return;
    this.reader.setOffsetY(event.contentOffset.y - 0.38 * h);
},
```

* **另一侧的证据**：PenBili 明确回避了它（`profiles/youdao-x5.md:250-251`）：

  > - scroller 滚动事件形态（`@scroll` 未验证）→「滑到底自动加载」未实现，以"刷新/加载更多"按钮替代

  它的替代实现（`PenBili-main/src/pages/index/index.vue:49-56`）：

```html
<div v-if="currentItems.length" class="more-row">
  <div class="more-half" @click="onRefreshTab"><text class="more-text">刷新</text></div>
  <div class="more-half" @click="tab === 'rcmd' ? loadMoreFromHot() : loadMoreHot()">
    <text class="more-text">{{ moreBtnText }}</text>
  </div>
</div>
```
（`moreBtnText` 在 `:413-417` 返回 `'加载更多' / '没有更多了'`。）

**给聊天 App 的建议**：主滚动只用 `<scroller>`；「滚到底自动加载更早消息」**先做成按钮**（与 PenBili 一致，风险最低）；若要用 `@scroll`，请按上面 `contentOffset` 形状读值，并把 `offset-accuracy="10"`（默认）当作触发粒度——**别依赖它每次像素级回调**。

### 6.3b `@scroll` 的第二个真实用例：横向滑动唤出/收起侧栏（doge-comic）

`doge-comic-main/src/pages/reader/reader.vue:18-19,169-178` —— 用 `contentOffset.x` 的越界量（`over-scroll` 允许负值）做手势：

```html
<scroller show-scrollbar="false" scroll-direction="horizontal" over-scroll="50px" over-fling="50px" @scroll="setOffsetX">
```
```js
setOffsetX(event) {
    if (!this.hidableSidebar) return;
    let offsetX = event.contentOffset.x;
    if (offsetX < -35) { this.showSidebar = true; }        // 向左越界 → 唤出
    else if (offsetX > 35) { this.showSidebar = false; }   // 向右越界 → 收起
},
```
这是「在同一屏里做手势」的可行范式（`v-show` 切换 `ButtonColumn`，`:style="{'margin-left': showSidebar ? '0' : '4vh'}"`，`reader.vue:4-17`）。

### 6.3c 硬件返回键：`$page.$npage`（聊天页必备）

`doge-comic-main/src/pages/reader/reader.vue:130-141`（doge-reader `reader.vue:172-185`、`filemanager.vue:60-71` 同款）：

```js
onShow() {
    this._backpressed = () => { this.back() }
    this.$page.$npage.setSupportBack(false);            // 关掉框架默认返回（否则直接退出页面）
    this.$page.$npage.on("backpressed", this._backpressed);
},
onHide() {
    this.save();
    this.$page.$npage.setSupportBack(true);             // ★ 离页必须恢复，否则影响其它页面
    this.$page.$npage.off("backpressed", this._backpressed);
},
```
**用法建议**：聊天页里返回键优先「关抽屉/取消输入/收键盘」，只有在「已在主列表」时才 `this.$page.finish()`（`back()` 里判断，见 `filemanager.vue:48-52`：`if (!this.manager.goBack()) { this.$page.finish(); }`）。

### 6.4 程序化滚动：`$page.$dom.scrollToElement(ref, { offset })`

*doge-calculator（`:69-75`）——每次按键后滚到算式末尾：*

```js
click(expr) {
  this.textColor = textColors.normal;
  this.core.input(expr);
  setTimeout(() => {
    this.$page.$dom.scrollToElement(this.$refs.end);
  }, 25);
},
```

*doge-reader（`:155-162`）——带 offset、且注释了同步等待原因（`:57` `const sync_wait_time = 25;`）：*

```js
go(ref, offset = 0) {
    return new Promise(resolve => {
        setTimeout(() => {
            this.$page.$dom.scrollToElement(this.$refs[ref], { offset });
            resolve();
        }, sync_wait_time);   // 25ms：等 DOM 更新完成，$refs 才是新节点
    });
},
```
模板里放锚点（`reader.vue:20,29`）：`<div ref="start" />` … `<div ref="end" />`。

实现（`index.common.js:10314-10359`）：沿 `$parent` 找最近的 scroller，按 `scroll-direction` 决定 `scrollLeft/scrollTop`，`offset` 会乘 `weex.config.env.scale`。

### 6.5 长列表的另一选择：`<list>` / `<recycle-list>`

`list` 在 `weexRegisteredComponents` 里；`recycle-list` 有专用编译器（`falcon-vue-precompiler/src/components/recycle-list.js`，`components/index.js:16`），并支持 `itemSize/itemColor/itemSelectedColor/textColor/timeColor/textHighlightColor` 这组 `customized` 样式（`validator.js:751-758`）。**样本零使用**——聊天列表用 `<scroller>` + `v-for` 即可（PenBili 评论区分页每次 +N 条就是这个量级）。

---

## 7. 字体与文本

### 7.1 字体

* **样本从未设置 `font-family`，也从未用 `@font-face`**（全仓库 *.vue/*.less grep `font-family|@font-face` = 0 命中）⇒ 走系统默认字体，中文正常显示（截图证据 `profiles/evidence/*.png`）。
* `@font-face` **是支持的**：styler 会把它编译成 `@FONT-FACE` 节点（`falcon-styler/index.js:137-156`），所以理论上可自定义字体；但要注意设备只保证 `/etc/miniapp/resources/fonts/` 下有系统字体（profile 提到 `HarmonyOS_Sans_SC_Regular.ttf` 是给 ffmpeg drawtext 用的，`youdao-x5.md:356-359`），**新工程不建议赌自定义字体**。
* `fontFamily` 在白名单里且不做校验（`validator.js:724` `fontFamily: ANYTHING_VALIDATOR`）——写了会被透传，但字体是否命中由 native 决定。
* **`<text>` 默认字号是 32px 级别**（`.weex-text{font-size:0.4266666666666667rem}`）；样本 **100% 显式写 `font-size`**。新工程必须在 `base.less` 里给 `text` 的每个类都写字号，否则会得到巨大文字。

### 7.2 字号梯度（实测取值）

| 层级 | PenBili (px) | dog 系 (vh → px) |
|---|---|---|
| 大标题/展示 | 16（`brand`）、16（`bar-time`） | 12vh→30.5 / 15vh→38.1（计算器显示） |
| 标题 | 15（`tab`）、15（`qr-state`）、14（`title`） | 12vh→30.5（`.title`） |
| 正文/列表主文 | **14**（行标题、按钮、输入框、`info-title`、`title`） | 10vh→25.4（`.content`/`.text`） |
| 次要 | 13（`.more-text`、`.mine-sec`、`info-ctrl-text`） | 9.5vh→24.1（主按钮文字）、9vh→22.9（按键） |
| 元信息 | 12（`.vmeta`、`.mine-value`、`.reply-write-text`）、11（`.bar-status`、`.mine-id`、`.reply-name/.reply-msg`） | 8vh→20.3（时间/描述） |
| 极小（慎用） | **10**（`.reply-sub-status`、`.reply-meta`） | 6vh→15.2（调试浮层） |

**推荐（聊天 App）**：气泡正文 `13~14px` + `line-height: 1.3`（≈17~18px）；昵称/时间 `11px`；空态提示 `13px`。

### 7.3 截断：`lines` + `text-overflow`

样式编译器把 `textOverflow` 白名单化为 `clip | ellipsis | unset | fade`，`lines` 是整数（`validator.js:719-731`）：

```js
text: {
  lines: INTEGER_VALIDATOR,
  color: COLOR_VALIDATOR,
  fontSize: LENGTH_VALIDATOR,
  fontStyle: genEnumValidator(['normal', 'italic']),
  fontFamily: ANYTHING_VALIDATOR,
  fontWeight: genEnumValidator(['normal','bold','100'…'900']),
  textDecoration: genEnumValidator(['none','underline','line-through']),
  textAlign: genEnumValidator(['left','center','right']),
  textOverflow: genEnumValidator(['clip','ellipsis','unset','fade']),
  lineHeight: LENGTH_VALIDATOR,
  letterSpacing: LENGTH_VALIDATOR
}
```

样本写法（`PenBili-main/src/styles/base.less:170-183`）：

```less
.vtitle { font-size: 14px; color: @text-color; lines: 2; text-overflow: ellipsis; }
.vmeta  { margin-top: 4px; font-size: 12px; color: @text-color-dim; lines: 1; text-overflow: ellipsis; }
```

**`-webkit-line-clamp` 的真相**：web 预览链路的预编译器会把模板 `style` 里的 `lines:N` 展开成 clamp —— `web-libs/falcon-vue-precompiler/src/components/text.js:8-14,16-29,59-72`：

```js
function getLinesStaticStyle (n) {
  return { overflow: 'hidden', 'text-overflow': 'ellipsis', '-webkit-line-clamp': `${n}` }
}
exports.processLines = function (el) {
  const tag = el._origTag || el.tag
  if (this.config.preservedTags.indexOf(tag) > -1 && tag !== 'text') { return }   // 只对 <text> 生效
  const staticStyle = getStaticStyleObject(el)
  const n = parseInt(staticStyle.lines)
  if (n > 0 && !isNaN(n)) { extend(staticStyle, getLinesStaticStyle(n)); el.staticStyle = JSON.stringify(staticStyle) }
}
```
⇒ **`lines` 只在「模板 style 属性」上被转成 clamp，且只对 `<text>` 元素**。写在 `.less` 类里的 `lines: N` 由 native 渲染器直接消费（PenBili 全量采用此法，真机验证有效）。**两条路都别混：类里写 `lines` + `text-overflow: ellipsis` 就是设备上的正确写法。**

### 7.4 长文本的三种处理（样本实证）

1. **固定行数 + 截断**（列表项/标题）：`lines: 1~4` + `ellipsis`（上面的 `.vtitle`）。
2. **整段塞进 `<scroller>`**（许可证/关于页/阅读器）：一个 `<text>` 里放几万字符，交给 scroller 滚。`doge-calculator-main/src/pages/license/license.vue:6-11` 把 AGPL 全文（716 行模板字面量）直接渲染：

```html
<scroller class="scroller" over-scroll="50px" over-fling="50px">
    <text class="title">许可证</text>
    <div class="wrapper"><text class="license">{{ license }}</text></div>
</scroller>
```
```less
.license { width: 80%; color: @neutral; font-size: 10vh; }   /* 宽 80% 触发自动换行 */
```
3. **手动分页**（阅读器 `page` 模式）：自己按 `charsPerLine = floor(viewportWidth / fontPx)` 切页（`doge-reader-main/src/utils/Reader/Reader.js:34-73`），水平方向每行按字符数切，英文按空格回退（`:54-58`）。**注意**：换行交给渲染器（`white-space: pre-wrap` + `word-wrap: break-word`）比自己算更省事，只在需要「精确页」时才自己切。

---

## 8. 图片与资源

### 8.1 `require(...)` 的两种模式（构建期，`rollup-plugins/image.js:19-21,74-84,153-173`）

```js
const REG_BASE64 = /[\?\&]base64/;
const REG_DOWNLOAD = /[\?\&]download/;
const REG_HTTP = /http[s]{0,1}:\/\/([\w.]+\/?)\S*/;
…
if (imgInfo.format == 'base64') {
  const source = fs.readFileSync(imgInfo.file, 'base64').replace(/[\r\n]+/gm, '');
  const dataUri = getDataUri({ format, mime, source });          // data:image/png;base64,…
  return constTemplate({ dataUri });                             // const img = "data:…"; export default img;
} else if (imgInfo.format == 'file') {
  const fileName = helper.md5(imgInfo.pathToRoot) + imgInfo.ext;
  const tempImagesDir = path.resolve(appInfo.getFalconBuildDir(), 'images');
  fs.copyFileSync(imgInfo.file, path.resolve(tempImagesDir, fileName));
  return `export default "images/${fileName}"`;                  // 相对应用根的路径
}
```

| 写法 | 结果 | 用在哪 |
|---|---|---|
| `require('../../assets/back.png?base64')` | 内联 **data URI**（免 IO，包变大） | **dog 系 100% 用这个**（`pages/index/index.vue:4-6` 等） |
| `require('../../assets/x.png')` | 拷到 `images/<md5>.png`，返回 `"images/<md5>.png"` | PenBili 的 CSS 背景图走这条（`style-json.js:71-80`） |
| `require('https://…/a.png?download')` | 构建期下载再按上一条处理 | 需要离线可用时 |
| `:src="'https://…/cover.jpg'"` | 原样输出，**运行时 ImageLoader 自行下载并缓存** | PenBili 封面（`index.vue:43`） |

支持扩展名（`image.js:23-31`）：`.jpg/.jpeg/.png/.gif/.bmp/.apng/.svg`。视频类走 `asset` 插件（`asset.js:15`）：`.mp4/.mkv/.mov/.avi/.wmv/.flv/.f4v/.hlv/.webm`。

### 8.2 模板写法：`<image>` 是唯一正确标签

```html
<!-- dog：data URI + 组件内等比缩放 -->
<image class="icon" :src="icon" />                     <!-- icon-button.vue:3 -->
<image resize="contain" class="icon" :src="icon"/>     <!-- main-button.vue:3 -->
<!-- PenBili：网络图 + 显式尺寸属性 -->
<image class="thumb" :src="it.cover" :width="112" :height="63"></image>   <!-- index.vue:43 -->
```

* `config.js:51-60` 把 `img / image / gif / figure` 都算内置组件，但**样本只用 `<image>`**（`<img>` 合法但零使用）。
* `resize` 属性被编译成 `v-weex-resize` 指令（`components/image.js:5-32`），取值 `contain/cover/stretch/left/right/top/bottom`（falcon-ui `FlImage` 默认 `contain`）。
* `image` 默认 `background-size: 100% 100%`（基础样式表 `.weex-image`）⇒ **不写 `resize` 会拉伸变形**；要等比就写 `resize="contain"` 或按原始宽高比给宽高。
* **路径规则（真机实测）**：`<image src>` 的非 http 路径按**应用根目录**拼接；传绝对路径会被拼成 `<approot>/<绝对路径>` 而失败（`profiles/youdao-x5.md:135-136`）。
* http 图片由运行时下载（日志 `[ImageLoader] begin download url` / `succeeded, local file: %s`，`youdao-x5.md:133-134`）。**设备无 CA 证书库**（`:184-186`）⇒ 尽量用 `http://`，或确认 https 可用性。
* **本地文件图片：`file://<绝对路径>`**（doge-comic 实证，`src/components/history-card.vue:12,27-37`）：

```js
import fs from 'fs';
…
async created() {
    if (this.node.type === 'file') {
        this.preview = `file://${this.node.path}`;                    // ★ 单文件
    } else {
        let img = (await fs.readdir(this.node.path, { withFileTypes: true }))
            .filter(file => file.isFile() && isImg(file.name))
            .sort(fileSort)[0];
        this.preview = img ? `file://${this.node.path}/${img.name}` : '';   // ★ 目录取首图
    }
}
```
模板端就是普通 `<image class="preview" resize="cover" :src="preview" />`（`:3`）。**`file://` 是绝对 URL，不会被拼到 app root**（与相对路径的规则不同）。

* 这套 `fs` 是工程自带的 JSAPI（`doge-comic-main/jsapi/src/fs.cpp`，构建时打进 `libs/`）。接口形态（`api-mock/fs.js`，mock 与真机同形）：`fs.readFile(path) → Promise<string>`、`fs.readdir(path, {withFileTypes:true}) → Dirent[]`（`isFile()/isDirectory()`）、`fs.stat(path) → {size}`。`doge-reader-main/src/pages/license/license.vue:52-60` 用它读 `assets/license.txt`：

```js
onShow() {
    const licensePath = `${$workspace}/assets/license.txt`;
    fs.readFile(licensePath).then(data => { this.license = data; })
        .catch(error => { this.license = "读取许可证文件失败，请务必联系作者 adogecheems 。"; });
},
```
（`$workspace` 是全局注入：`base-page.js:93` `Vue.prototype.$workspace = globalThis.$workspace`。走 native `fs` 就要自己 fork 一份 `jsapi/src/fs.cpp` 并交叉编译成 `libs/*.so`。）

* 单张图渲染失败不影响布局，但要给容器写底色（`background-color: @card-border-color`）避免空洞。

### 8.3 应用图标

* **必需**：`package.json.icon` 指向工程根的一张 PNG；构建时被拷到产物根（`steps/manifest.js:33-43`）：

```js
if (appPkg.icon) {
  const iconFilePath = appInfo.pathResolve(appPkg.icon);       // 相对工程根
  const distIconPath = path.resolve(DIST_DIR, path.basename(appPkg.icon));
  if (fs.existsSync(iconFilePath)) { fs.copyFileSync(iconFilePath, distIconPath); }
  filesInfo.icon = path.basename(appPkg.icon);
} else { console.log(colors('yellow', 'WARNING: 未在package.json:中配置应用icon路径')); }
```
* **没有尺寸校验/缩放**——实测并存三种：PenBili `256×256`（4939 B，透明底）、dog 计算器根部 `960×958`（486 KB）、dog 阅读器 `962×959`（521 KB）；`src/assets/app_icon.png` 又是另一个尺寸（dog 计算器 128×128）。文件夹里的 `.amr` 内 `app_icon.png` 与根部文件字节一致。
* 缺失的后果（`tools/make_icon.js:1-2` 注释）：**「词典笔桌面在没有 icon 时不显示应用，因此这个文件是打包必需项」**。
* **两套生成脚本**（可直接移植）：
  * `tools/make_icon.js`（91 行，零依赖）：用 `zlib` 手写 PNG，`SIZE = 192`，画渐变圆 + 播放三角。产物自报 `wrote …/app_icon.png (N bytes, 192x192)`。
  * `tools/make_icon_v2.js` + `tools/make_icon_v2.py` + `tools/icon_colors.json`：把 `favicon.svg` 的 `fill="currentColor"` 换成 ICO 主色（`#00a1d6`），用 `@resvg/resvg-js` 渲染成 **256×256 透明底**，并在终端打印 `transparent=%` / `blueLines=%` / `bytes=` 做像素级自检（因为模型读不了图，`make_icon_v2.js:26-43`）。
* 推荐：**256×256 RGBA PNG、透明底、图形占 80% 以上**（对齐 PenBili 的成品）。

---

## 9. Vue 2 能力边界（样本实证）

**运行时版本**：`vue-template-compiler@2.6.12`（`cli-libs/vue/packages/vue-template-compiler/package.json`）、falcon 定制编译器 `falcon-template-compiler@2.6.12-falcon3`（`weex-template-compiler/package.json`）；`vue` 与 `falcon-vue-render` 在打包时是 **external**（`libs/rollup.config.js:60`），由 native 提供 → **模板一律预编译成 render 函数**（`falcon-vue.js:118-138`），运行时不做模板编译。

| 特性 | 状态 | 样本证据 |
|---|---|---|
| `v-for` + `:key` | ✅ 全样本大量 | `PenBili src/pages/index/index.vue:42`、`doge-reader .../index.vue:16` |
| `v-if / v-else-if / v-else` | ✅ | `doge-reader .../filemanager.vue:11-17` |
| `<template v-if>` / `<template v-else>` 包整段 | ✅ | `PenBili .../index.vue:6,17` |
| `v-show` | ✅ | `doge-reader .../favorite.vue:9`、`components/drawer.vue:3` |
| `computed` | ✅（含依赖方法调用） | `doge-calculator .../index.vue:58-67`、`PenBili .../index.vue:378-432` |
| `data()` / `async created()` / `mounted`（隐式）/ `beforeDestroy` | ✅ | `PenBili .../index.vue:433-443`；`components/toast.vue:16-31` |
| `methods` 里的 `onShow/onHide/onUnload` | ✅ 被基类调用 | §1.5 |
| `components: {}` 局部注册 | ✅ | 全部页面 |
| `props`（`type/required/default`） | ✅ | 全部 dog 组件 |
| `$emit('click', payload)` + 父级 `@click="fn"` | ✅ | `components/button.vue:3` → `pages/index/index.vue:18` |
| 默认 `<slot />` | ✅ | `components/button-column.vue:3`、`setting-card.vue:7` |
| 具名 slot / scoped slot | ❓ **零使用** | 无样本；不建议在首版依赖 |
| `:class` 对象 / 字符串 / 三元 | ✅ | `components/menu-card.vue:2`（对象）、`PenBili .../diag.vue:23`（三元）、`index.vue:151`（拼接字符串） |
| `:style` 对象 | ✅ | `components/button.vue:3`、`pages/index/index.vue:12`（`:style="{ color: textColor }"`） |
| 静态 `style="..."` | ✅ | `doge-reader .../index.vue:8`、`:15`（含 `transform: translateY(22vh)`） |
| `ref` + `this.$refs.x` | ✅ | `doge-calculator .../index.vue:13,73` |
| `@click` | ✅（映射 `weex$tap`） | 全样本 |
| `@scroll` | ✅ 绑定成立；负载见 §6.3 | `doge-reader .../reader.vue:17`、`doge-comic .../reader.vue:19`（横向） |
| `@change` / `@changing` 于原生表单组件 | ✅ 负载是 `e.detail.value` | `doge-comic .../components/seekbar-card.vue:7-9,37-42` |
| 原生 `<seekbar>`（进度/拖动条） | ✅ | 同上；props `min/max/step/value/active-color/background-color/handle-color/track-size/handle-size` |
| 原生 `<richtext>`（块级富文本容器） | ✅ | `doge-comic .../reader.vue:21-25`：`<richtext><template v-for="url in reader.segment"><image :style="{width} " :src="url" /><br></template></richtext>` —— **`<br>` 作为换行节点** |
| `$page.$npage` 硬件返回键 | ✅ | `doge-comic .../reader.vue:130-141`（见 §6.3c） |
| Less `@import url(../styles/x.less);` 写法 | ✅ | `doge-comic .../components/index-button.vue:19` |
| 其它原生事件名（白名单） | 可用：`tap/touchstart/touchend/touchmove/swipe/panstart/panmove/panend/longpress/long/input/key/keyup/keydown/return/change/focus/blur/active/appear/disappear/offsetAppear/offsetDisappear/refresh/pullingdown/loading/start/pause/finish/fail` | `falcon-vue-precompiler/src/config.js:63-101` |
| `@click.stop` / `.prevent` / `.native` | ⚠️ 不建议手写：编译器**默认就给原生事件加 `.stop`**（`hooks/events.js:113-125`）；`.native` 会被内部改写（`:164-186`） | — |
| `watch` | ❓ **零使用**（Vue 2.6 运行时支持，但样本无验证） | — |
| `filters` | ❓ 零使用 | — |
| `v-html` / `v-text` / `v-model` | ❓ 零使用（`input/textarea/switch` 组件存在，但样本没有表单） | — |
| `<component :is>` 动态组件 | ❓ 零使用。PenBili 用 `v-if/v-else-if` 链代替（`index.vue:41,63,92,135`）——**首版请沿用 `v-if` 链** | — |
| `keep-alive` | ❓ 零使用（多标签页状态是**数据驱动**：`tab` 字符串 + `v-if`，`PenBili index.vue:337-338`） | — |
| CSS `transition`（transform/background-color/opacity） | ✅ | `components/drawer.vue:66`、`toggle.vue:45,60`、`toast.vue:48` |
| CSS `@keyframes` + `animation` | ✅ 白名单有（`validator.js:742-750`），构建器会给 keyframe 名追加 scopeId（`style-json.js:90-114`） | 样本未用，可试 |
| `position: fixed/absolute/sticky` | ✅ | `drawer.vue:41-43`(fixed)、`reader.vue:214-225`(absolute 半屏热区)、`style.js:9-17`(sticky→`weex-sticky`) |
| `box-shadow` | ✅（必须 4 段：`10px 10px 10px #000`，`validator.js:551-559`） | — |
| `!important`/`float`/`grid`/`filter`/`visibility`/`white-space`/`word-break`/`cursor`/`pointer-events` | ❌ 不在白名单，写了被丢弃 | `validator.js:645-759` |
| 后代/元素/属性选择器 | ❌ 丢弃（见 §0 第 3 条） | `falcon-styler/index.js:94-131` |
| `<hole>` | ⚠️ native 扩展：PenBili 用它把视频区从框架画布里挖空（`index.vue:204`、`diag.vue:4`；`profiles/youdao-x5.md:151-153` 真机验证 0 黑帧）。它**不在**预编译器内置标签表里 | 聊天 App 用不到 |

**一个必须知道的坑（事件冒泡）**——`web-libs/falcon-vue-precompiler/src/hooks/events.js:113-125`：

```js
if (!hasBubbleParent) {
  // 自定义组件不要添加.stop,因为没有stopPropagation方法.web上执行的时候会出错!
  // 原生事件或者原生组件才添加stopPropagation方法
  if (isNativeEvents || !isCustomComponent) {
    for (const k in evts) {
      if (weexEvents.indexOf(k) > -1) {
        const evt = evts[k];
        const modifiers = evt.modifiers || (evt.modifiers = {});
        modifiers.stop = true;                 // ★ 默认 stopPropagation
      }
    }
  }
}
```
要在父节点上同时收到子节点的 weex 原生事件：给**父节点**写 `bubble="true"`（`:153-157`：`const bubble = attrsMap.bubble; if (bubble === 'true' || bubble === true) el._bubble = true;`）。

---

## 10. 构建与安装

### 10.1 命令与 flag 语义（源码级）

`cli.js:178-188`：

```js
for (name of ['build', 'b']) {
  program
    .command(name, { isDefault: true })          // ★ 默认命令：不写子命令就是 build
    .description("构建应用")
    .option('-c, --compress', `是否压缩脚本`, false)
    .option('-q, --qjsc', `是否使用qjsc预编译`, false)
    .option('-p, --pack', `是否打包`, false)
    .option('-m, --mock', `是否模拟 JSAPI`, false)
    .option('-e, --env <var...>', `加入环境变量`)
    .action(async (...args) => globalResult = await deviceBuild(...args))
}
```
`cli-actions/build.js:74-109`：

```js
module.exports = async function (command) {
  const { compress, qjsc, pack, mock, env } = command;
  if (!info.isValidRoot()) { return -1 }
  prepare();                                    // 清空 .falcon_ / .falcon_tmp，删除旧 .amr
  const packageInfo = info.getAppPackageInfo();
  if (!packageInfo.appid) { /* ERROR: appid 长度16，以800开头 */ return }
  await build({ minify: compress, mock, env }); // 1) rollup 打包
  if (qjsc) { await qjscAll(share.internalModules); }  // 2) js → QuickJS 字节码
  if (pack)  { await manifest.generate(); await package.pack(); }  // 3) manifest + zip
  return 0
}
```

| flag | 效果 |
|---|---|
| （无） | 只 rollup 打包到 `.falcon_/`（`.js` 明文，可读） |
| `-c` | 追加 `terser()` 压缩（`libs/rollup.config.js:111-113`） |
| `-q` | 每个 `.js` 用 `qjsc` 编成 `.js.bin` 并**删除 `.js`**（`steps/qjsc.js:19-43`） |
| `-p` | 生成 `manifest.json`（含每个文件 size+md5）并 zip 成 `.amr`（`steps/manifest.js`、`steps/pack.js`） |
| `-m` | 把 `api-mock/*.js` 注入为 JSAPI mock（`libs/common.js:87-103`、`rollup.config.js:36-41`） |
| `-e K=V` | 编译期字符串替换（`rollup.config.js:48-58`），值为裸标识符时置 `true` |
| 其它子命令 | `preview/p`（浏览器预览）、`build-web/w`、`simulator/s`、`upload/u`、`adb/a`、`check/r`、`create/c` |

**本仓库的精确调用**（`PenBili-main/package.json:18-20`）：

```json
"build":      "node ../env/node_modules/aiot-vue-cli/src/cli.js -q -p",
"build:dev":  "node ../env/node_modules/aiot-vue-cli/src/cli.js",
"build:prod": "node ../env/node_modules/aiot-vue-cli/src/cli.js -c -q -p"
```
任务给出的绝对路径等价于此（同一份 `cli.js`，`aiot-vue-cli@1.0.32`，bin 名 `aiot-cli`，`package.json:6-8`）：

```powershell
node "C:\Users\PC\Desktop\PenBili-main\node_modules\aiot-vue-cli\src\cli.js" -q -p
```

> ⚠️ 两个已知环境坑（`profiles/youdao-x5.md:236-239`）：
> 3. aiot-vue-cli 的 qjsc 步骤需 spawn 子进程（工作区沙箱下 EPERM，需放行）。
> 4. 含中文的 `.ps1` 被 PowerShell 5.1 执行时必须存成 **UTF-8 with BOM**，否则按 GBK 解析导致引号错乱。
>
> 还有一条来自 dog README（`doge-reader-main/README.md:69-75`）：**Node 22+ 可能构建失败，用 16/18/20**（PenBili 在 v24 上验证通过，所以先试本机 Node）。

### 10.2 产物解剖

`-q -p` 之后，工程根出现 `<appid>.<version 点→下划线>.amr`（`libs/appinfo.js:187-194`）：

```js
getAmrPath() {
  const DIST_FILE_BASE_NAME = packageInfo.appid ? packageInfo.appid : (packageInfo.name ? … : 'dist');
  const DIST_VERSION = (packageInfo.version ? packageInfo.version : '0.0.0').replace(/\./g, '_');
  return path.resolve(DIST_DIR, `${DIST_FILE_BASE_NAME}.${DIST_VERSION}.amr`)
}
```
实测（`8002026091900004.2_3_0.amr`，96698 B，`50 4B 03 04` = **zip**，解包内容与 `.falcon_/` 一致）：

```
app.js.bin                 1140 B     # app 入口（字节码）
base-page-dca68d51.js.bin  2171 B     # 共享 chunk（base-page，文件名带内容 hash）
player-479c1847.js.bin    30548 B     # 共享 chunk
index.js.bin              82508 B     # pages/index/index.js（每页一个 chunk）
diag.js.bin               13542 B     # pages/diag/diag.js
manifest.json               916 B
app_icon.png               4939 B     # 256x256 RGBA
libs/libjsapi_httpjson.so 15072 B     # 自定义 native（syncDirs 从工程根 libs/ 拷来）
libs/libjsapi_player.so   32388 B
```

`manifest.json` 全文（节选，`.falcon_/manifest.json:1-40`）：

```json
{
  "appName": "PenBili",
  "version": "2.3.0",
  "appid": "8002026091900004",
  "icon": "app_icon.png",
  "quickjs": { "version": "20200705", "bigNum": false },
  "cert": {
    "app.js.bin": { "size": 1140, "md5": "6fbc63c4ee65ae4c7445b82055a7822f" },
    "base-page-dca68d51.js.bin": { "size": 2171, "md5": "83520723c579e188dc207c081a793336" },
    "player-479c1847.js.bin": { "size": 30548, "md5": "e5f3f66c4ef42f13da38ee37a7cf4780" },
    "index.js.bin": { "size": 82508, "md5": "e7656ceda8243a4ae2a747a54408b12d" },
    "diag.js.bin": { "size": 13542, "md5": "e92bbe996c856b3e30a8b1af7618b609" },
    "libs/libjsapi_player.so": { "size": 32388, "md5": "5bba9250ea8a151e849eac7b43a9a5f7" },
    "libs/libjsapi_httpjson.so": { "size": 15072, "md5": "d1b6efb6c3993841a5d5b84aad4de687" }
  }
}
```

**`.js.bin` 是什么**：`qjsc -m -c -N <cname> -o out.c <file>.js` → 从生成的 C 数组里抽字节（`cli-libs/aiot-qjsc-tool/libs/qjsc.js:79-125`）。字节流开头是**字符串/原子表**（所以类名、hex 颜色、字符串字面量可 grep 到），后面是 QuickJS 字节码。

实测 grep 结果（`.falcon_/diag.js.bin`）：`g-ok` / `348px` / `panel` / `video-hole` / `#4caf7d` **各命中 1 次，且是「无点号的紧凑 JSON」形态**：

```
…800px.width.254px.height.row.flexDirection.#0e1116.backgroundColor.page.452px.video-col.
rgba(0,0,0,0).video-hole.center.justifyContent.alignItems.video-idle.14px.fontSize.#8d99a6.color.
video-idle-text.348px.column.10px.paddingLeft.8px.paddingRight.6px.paddingTop.paddingBottom.panel.
22px.head.flex.15px.#e9eef4.lines.ellipsis.textOverflow.title.11px.head-meta.…
```

⇒ 与 profile 的结论一致（`youdao-x5.md:235-236`）：

> 2. 打包器把样式存成**无点号紧凑结构**（`g-ok`/`#3ea6ff`/`348px` 字面量），产物断言不要按 CSS 文本（`.g-ok`）形态去 grep。
> 3.（见 `youdao-x5.md:289-290`）生产包（`-p`）**含字面量混淆**：业务字符串/数字在 bundle 中变换 → **产物断言只用结构标识符，功能以运行时日志为准**。

### 10.3 安装 / 运行（adb + miniapp_cli）

README 版（`PenBili-main/README.md:87-96`）：

```bash
adb push PenBili.amr /tmp/PenBili.amr
adb shell miniapp_cli install /tmp/PenBili.amr
adb shell miniapp_cli start 8002026091900004 --index
```

dog 版（更贴近实际，带 `ret:0` 预期，`doge-reader-main/README.md:35-47`）：

```bash
adb push <你安装包的路径/>all.amr /userdisk/Favorite/
adb shell "miniapp_cli install /userdisk/Favorite/all.amr"
# 之后可在桌面看到图标
```

一键脚本（`doge-calculator-main/install.sh:1-13`，Linux/Git-Bash）：

```bash
#!/bin/bash
page="$1"
npm run build:prod
amr_file=$(ls *.amr)
base_name="${amr_file%%.*}"
adb push $amr_file /userdisk/Favorite/
rm -f *.amr
adb shell "miniapp_cli install /userdisk/Favorite/$amr_file"
adb shell "miniapp_cli start $base_name $page"
```

`miniapp_cli` 子命令全集（从 deploy.ps1 与 profile 归纳）：`install <path>` / `start <appid> [page]` / `start <桌面 appid>`（回桌面）/ `capture <png>`（整页截屏）/ `captureFB <png>`（裸 fb 截图，含 native 视频区）/ `memoryApp`。桌面 appid = `8080222437664451`。

**装机运行时的关键事实**（`profiles/youdao-x5.md:49-52,140-141`）：

```yaml
install_dir: "/userdisk/miniapp/data/mini_app/pkg/<appid>/<slot a|b>/"
storage:     "/userdisk/miniapp/data/mini_app/pkg/<appid>/data/sharedpreferences/preferences.json"
native_lib:  "AMR 内 libs/libjsapi_player.so → 装机后成为 <slot>/libs/libjsapi_player_<hash>.so"
log:         "/userdata/applog/DictPen_*.log（只落 console.warn/error）"
```
> `miniapp_cli start <appid> <page>`：同一页面再次 start **不会重建页面实例**（不重读 onLoad options）；自动化验证需先 start 另一个页面再 start 目标页。

### 10.4 权威部署序列：`tools/deploy.ps1` 原文

`PenBili-main/tools/deploy.ps1`（`PenBili-2.3.1/PenBili-2.3.1/tools/deploy.ps1` 与之**逐字节相同**）。头部与本机定位：

```powershell
# 真机部署与验证脚本（有道 X5，fw3.4.6，profile: profiles/youdao-x5.md）
#
# 流程：
#   1) 设备与产物检查（AMR + native ELF）
#   2) 安装（要求 ret: 0）+ 核对安装 slot 的 manifest / .so 落位
#   3) 切桌面 → 冷启动到规范启动页 index（先切走再启动，保证重建页面实例）
#   4) 取证：中段 captureFB（大概率正播着）→ 30s 后整页截屏 + [bili] 日志
#   5) 两次进出循环：每轮退出后 ffmpeg/aplay 残留 = 0，再次进入重新取证
#   6) 关闭自检种子 → 干净冷启动终态截图（交付状态：无自检）
#   7) 证据落 profiles/evidence/
#
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File tools/deploy.ps1 [-Autotest]
param(
  [string]$StartPage = 'index',
  [switch]$Autotest
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
# adb 定位：$env:BILI_ADB → PATH 中的 adb → 本机开发布局（../env/adb）
$adb = $env:BILI_ADB
if (-not $adb) { $c = Get-Command adb -ErrorAction SilentlyContinue; if ($c) { $adb = $c.Source } }
if (-not $adb) { $cand = Join-Path $root '..\env\adb\adb.exe'; if (Test-Path $cand) { $adb = (Resolve-Path $cand).Path } }
if (-not $adb) { throw '找不到 adb：请设置 BILI_ADB 指向 adb.exe，或将 adb 加入 PATH' }
$appid = '8002026091900004'
$desktop = '8080222437664451'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$ev = Join-Path $root 'profiles\evidence'
$prefsDir = "/userdisk/miniapp/data/mini_app/pkg/$appid/data/sharedpreferences"
$seedFile = Join-Path $root '.deploy\preferences.json'
$wait = if ($Autotest) { 45 } else { 12 }   # 慢网络下自检全程可达 40s+（单请求上界 15s）
New-Item -ItemType Directory -Force -Path $ev | Out-Null

function Step($m) { Write-Host "`n=== $m ===" -ForegroundColor Cyan }

function Pull-Capture([string]$remote, [string]$local) {
  & $adb pull $remote $local | Out-Null
  if (Test-Path $local) { Write-Host "evidence: $local" } else { Write-Host "MISSING: $local" -ForegroundColor Yellow }
}

function Push-Seed([string]$mode) {
  node (Join-Path $root 'tools\seed_settings.js') $mode | Out-Null
  & $adb shell "mkdir -p $prefsDir" | Out-Null
  & $adb push $seedFile "$prefsDir/preferences.json" | Out-Null
  Write-Host "seed autotest=$mode → $prefsDir/preferences.json"
}
```

七个步骤（`deploy.ps1:48-120`，逐字引用关键行）：

```powershell
Step '1/7 设备'
& $adb devices -l

Step '2/7 产物与 native 检查'
# 交付包为 PenBili.amr（应用名）；回退 appid.*.amr（aiot-vue-cli 下次构建仍用 appid 命名）
$amr = Get-ChildItem -Path $root -Filter 'PenBili*.amr' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $amr) { $amr = Get-ChildItem -Path $root -Filter "$appid.*.amr" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 }
if (-not $amr) { throw '找不到 AMR 包，请先 npm run build' }
Write-Host "AMR: $($amr.Name) ($([math]::Round($amr.Length/1KB,1)) KB)"
python (Join-Path $root 'tools\inspect_elf.py') (Join-Path $root 'libs\libjsapi_player.so') | Select-Object -Last 5

Step '3/7 安装（ret:0 校验）'
& $adb push $amr.FullName /tmp/bili_app.amr
$ins = & $adb shell "miniapp_cli install /tmp/bili_app.amr"
$ins
if ("$ins" -notmatch '"ret":\s*0') { throw 'install 未返回 ret:0' }
& $adb shell "find /userdisk/miniapp/data/mini_app/pkg/$appid -maxdepth 3 -name '*.so'"
& $adb shell "find /userdisk/miniapp/data/mini_app/pkg/$appid -maxdepth 3 -name 'manifest*'"

Step '4/7 冷启动首轮（规范启动页' + $StartPage + '，Autotest=' + $Autotest + '）'
if ($Autotest) { Push-Seed 'on' } else { Push-Seed 'off' }
& $adb shell "miniapp_cli start $desktop" | Out-Null      # 先切桌面
Start-Sleep -Seconds 2
$st = & $adb shell "miniapp_cli start $appid $StartPage"  # 再冷启动目标页（保证重建实例）
$st
Start-Sleep -Seconds 10
$fb1 = "/tmp/bili_${stamp}_app1_fb.png"
& $adb shell "miniapp_cli captureFB $fb1"
Pull-Capture $fb1 (Join-Path $ev "app1_${stamp}_fb.png")   # 可能截到播放中帧（自检中段）
Start-Sleep -Seconds ([Math]::Max(2, $wait - 10))
$cap1 = "/tmp/bili_${stamp}_app1.png"
& $adb shell "miniapp_cli capture $cap1"
Pull-Capture $cap1 (Join-Path $ev "app1_${stamp}.png")

$log1 = & $adb shell "grep -h '\[bili\]' /userdata/applog/DictPen_*.log | tail -n 60"
$log1
$log1 | Out-File -FilePath (Join-Path $ev "app1_${stamp}_log.txt") -Encoding utf8

Step '5/7 进出循环 1：退出 → 残留检查 → 再进入'
& $adb shell "miniapp_cli start $desktop" | Out-Null
Start-Sleep -Seconds 3
$left1 = & $adb shell "ps | grep -c '[f]fmpeg'"
$left1a = & $adb shell "ps | grep -c '[a]play'"
Write-Host "exit1 残留: ffmpeg=$left1 aplay=$left1a (期望 0/0)"
& $adb shell "miniapp_cli start $appid $StartPage" | Out-Null
…

Step '7/7 汇总'
& $adb shell "miniapp_cli memoryApp" | Select-Object -First 5 | Tee-Object -FilePath (Join-Path $ev "memory_${stamp}.txt") | Out-Null
Write-Host "证据目录: $ev"
Write-Host "检查点：install ret:0 / AUTOTEST PASS 日志 / app1 截图像素非黑 / 残留 0/0 / final 无自检冷启动"
```

**部署教训（务必照做）**（`profiles/youdao-x5.md:402-403`）：

> - **部署教训（本轮实测踩坑）**：deploy 的 AMR 查找 `PenBili*.amr` 优先——打包后必须**立即换名**并做包内校验，否则会**静默部署旧包**（表象：gate 日志缺失、以为代码没生效；根因是设备跑旧版）。

**没有触摸注入**（`youdao-x5.md:142-143`）：设备无 `sendevent/getevent/input`（只有只读 `evtest`），所以自动化验证靠「storage 开关 + 页面内自检复用按钮同一代码路径」——PenBili 的做法值得抄（`PenBili-main/src/pages/index/index.vue:1490-1587`：`bili_autotest` 开关触发 `runAutotest()`，逐步 `logWarn('[bili] AUTOTEST …')`，日志只落 `console.warn/error`）。

---

## 11. 给「AI 聊天客户端」的落地建议（基于以上证据）

1. **骨架**：`setViewPort(800)` + 绝对 px（PenBili 路线），三个文件起手：`package.json` / `src/app.js`（PenBili 版）/ `src/app.json`（`pages: { index: "pages/index/index.vue" }`，页面 JS 可省）。`src/base-page.js` 用 PenBili 版（自带 `onUnload` 资源回收）。
2. **样式**：`src/styles/var.less`（抄 PenBili 的 10 行色板）+ `src/styles/base.less`。**每个 `.vue` 都写 `<style lang="less" scoped>@import "../../styles/base.less";</style>`**；类名一律「扁平单类 + `-on`/`-dim` 变体」，状态用 `:class` 切。
3. **布局**：174px 左轨（会话/设置/关于）+ 626px 主区；或更宽的对话区（去掉左轨 → 800px 全宽）。消息行建议 72~88px 高、头像 40×40、正文 13~14px/`lines: 6`+`ellipsis`。
4. **滚动**：`<scroller class="list">` + `v-for` 消息；**新消息用 `<div ref="end" />` 锚点 + `this.$page.$dom.scrollToElement(this.$refs.end)`（延迟 25ms）**；「加载更早」先用按钮（PenBili 已验证的保守方案）。
5. **输入**：走系统输入法——`import globalModule from 'global'` → `new globalModule.Global()` → `startTextEdit(JSON.stringify({text, placeholder, maxlength, autofocus}))`（同步返回 uuid），完成回调双通道 `module.textEditFinished.on` / `$falcon.on('textEditFinished')`，90s 看门狗，`onUnload` 时 `dispose()`。**整套封装可直接抄 `PenBili-main/src/services/input.js`（308 行，真机验证过中文输入）**，注意它记录的坑：输入法拉起会触发宿主 `onHide`，此时**不能做 teardown**（`index.vue:1477-1485`）。
6. **网络**：`$falcon.jsapi.http.request({url, method, header, timeout}, cb)`（自定义头字段是**单数 `header`**；成功 `{result: body}`；非 2xx 只有 `errorMessage:'curl … resCode:N'`，**拿不到响应体/响应头**）。封装参考 `src/services/net.js`（253 行：`unwrapResponse` / `httpGet` / 超时竞速 / native `httpjson` form POST 与二进制）。**流式 SSE 在本平台很可能不可用**（响应体一次性返回），聊天建议做「非流式请求 + 分段打字机动画」；若要真流式，需要自写 native `.so` 放进 `libs/`（`native/build.ps1` 用 zig 交叉编译，`.so` 会被 `syncDirs` 打进包；装机后会被重命名为 `<slot>/libs/<name>_<hash>.so`）。
7. **存储**：`$falcon.jsapi.storage.getStorage({key})` / `setStorage({key, data})`——**必须用对象形态**，`data` 字段名不能错，字符串形态的 Promise 可能永不 settle。抄 `src/services/storage.js`（209 行：内存兜底 + 5s/3s 超时 + 写后读校验 + JSON schema version）。
8. **图标**：256×256 透明底 PNG，放工程根并在 `package.json.icon` 声明（缺了桌面不显示）。
9. **验证套路**：`tools/deploy.ps1` 改 appid/包名 → 打包 → **重命名 .amr** → push/install（校验 `ret:0`）→ `start $desktop` → `start <appid> index` → `captureFB` + `capture` + `grep '[tag]' /userdata/applog/DictPen_*.log`；页面内写 `$falcon` 驱动的自检钩子（storage 种子开关）替代触摸注入。
10. **别做**：`overflow: scroll`、后代选择器、`display: block/inline`、`v-html`、假设 `@scroll` 每次像素级回调、假设 https 可用、依赖 `watch/filters/具名插槽`（无样本证据）。
11. **组件直接抄这几个**（省 1~2 天）：`doge-comic` 的 `seekbar-card.vue`（原生 `<seekbar>` 拖动条，`e.detail.value`）、`icon-button/primary-icon-button/main-button/menu-card/history-card/setting-card/toggle/drawer/toast/button-column`（doge-reader/doge-comic 两份互相补充）、`PenBili-main/src/services/input.js`（系统输入法）、`services/storage.js`（storage adapter）、`services/net.js`（http adapter）、`PenBili-main/src/pages/index/index.vue:1490-1587`（无触摸注入时的自检范式）。
12. **返回键**：聊天页里先关抽屉/取消输入，再退页；用 `$page.$npage` 接管（§6.3c），并在 `onHide` 恢复 `setSupportBack(true)`。

---

## 附录 A：核心样式属性白名单（`falcon-styler/lib/validator.js:645-759`）

**支持**（camelCase 或 kebab-case 均可，编译器统一转 camelCase，`falcon-styler/index.js:80`）：

* **盒模型**：`width height minWidth minHeight maxWidth maxHeight`、`overflow(visible|hidden)`、`padding*`、`margin*`、`borderWidth/borderLeftWidth/borderTopWidth/borderRightWidth/borderBottomWidth`、`borderColor/borderXColor`、`borderStyle(dotted|dashed|solid)/borderXStyle`、`borderRadius/borderXRadius`、`boxSizing(border-box)`、`display(flex)`、`boxShadow`
* **Flex**：`flex`（数字/auto/initial/none）、`flexGrow flexShrink flexBasis`、`flexWrap`、`flexDirection`、`justifyContent`、`alignItems alignSelf alignContent`、`gap rowGap columnGap`
* **定位**：`position(relative|absolute|sticky|fixed)`、`top bottom left right`、`zIndex`
* **通用**：`opacity`、`backgroundColor`、`backgroundImage`、`backgroundRepeat`、`backgroundSize(auto|contain|cover)`、`backgroundPosition`
* **文本**：`lines`（整数，★截断核心）、`color`、`fontSize`、`fontStyle`、`fontFamily`、`fontWeight`、`textDecoration`、`textAlign`、`textOverflow(clip|ellipsis|unset|fade)`、`lineHeight`、`letterSpacing`
* **过渡**：`transitionProperty transitionDuration transitionDelay transitionTimingFunction`。**简写 `transition: <property> <duration> <timing> <delay>` 可以直接写**——构建器会拆开（`falcon-styler/lib/shorthand-parser.js:9-19,62-66`；样本 `drawer.vue:66` `transition: transform 0.3s ease-in-out;`、`toggle.vue:60` `transition: all 0.15s ease-in-out;` 均按此生效，`all` 被 `TRANSITION_PROPERTY_VALIDATOR` 显式放行）。注意顺序固定为 property→duration→timing→delay。
* **伪类**：只有 `:active` 这类**单伪类**能用（`.tab:active { opacity: 0.7 }`）。编译结果不是选择器，而是把属性名拼上伪类后缀塞进同一个类：`{"tab": {"opacity:active": 0.7}}`（`falcon-styler/index.js:94-108`；产物字节码里实测可见 `…opacity:active.btn`）。**小技巧**：不写 `:active` 而用 `:class="{'tab-on': active}"` 是样本的主流做法，二者可共存。
* **变换/动画**：`transform transformOrigin`、`animationName/Delay/Duration/Direction/IterationCount/TimingFunction/FillMode`
* **列表定制**：`itemSize itemColor itemSelectedColor textColor timeColor textHighlightColor`

**不支持（写了被静默丢弃 + 构建 warning）**：`float grid filter backdropFilter visibility whiteSpace wordBreak wordWrap textIndent cursor outline content willChange pointerEvents resize userSelect`、`background` 简写（会被建议改成 `backgroundColor`）、`overflow: auto/scroll`、`display` 的非 flex 值。

**长度单位**：`px pt wx rpx vh vw %`（`validator.js:174-175`）；无单位数字合法；不支持的单位会被自动降级为 px 并打 NOTE（`:202-209`）。

## 附录 B：快速排错表

| 症状 | 最可能原因 | 检查 |
|---|---|---|
| 整页黑/空白，但组件树存在（`memoryApp` 有 Elm） | 某个 `.vue` 没有 `<style>` 块，或其 `@import` 路径错 | grep `app.js.bin`/`<page>.js.bin` 里的颜色字面量（如 `#0e1116`） |
| 某个类完全不生效 | 选择器不是单类（有后代/元素/逗号/属性） | 构建日志里 `ERROR: Selector '…' is not supported. Weex only support single-classname selector` |
| 文字巨大 | `<text>` 没写 `font-size`（默认≈32px） | 给所有文本类补 `font-size` |
| 截断不生效 | 写成了 `-webkit-line-clamp` 而没有 `lines` | 改成 `lines: N` + `text-overflow: ellipsis` |
| 列表滚不动 | 用了 `overflow: scroll` | 换成 `<scroller>` |
| 子元素点击没冒泡到父元素 | 原生事件默认 `.stop` | 父节点加 `bubble="true"` |
| 图片不显示 | 传了绝对路径（会被拼到 app root 下），或 https 无 CA | 改相对路径/`http://`；看日志 `ImageLoader` |
| 子进程报 EPERM（qjsc 步骤） | 沙箱禁止 spawn | 放开对 `cli.js` 的 spawn 限制 |
| 部署后代码没生效 | 打包后没改 `.amr` 名，deploy 挑了旧包 | 打包后立刻重命名，并核对 manifest 里的 md5 |
| `miniapp_cli start` 后页面没重建 | 同页重复 start 不重建实例 | 先 `start $desktop` 再 `start <appid> <page>` |
