# 有道词典笔 X5 扫描/OCR 链路逆向笔记

> 目的：让 AiChat 能直接拿到「扫描到的文字」，免去在笔上一个字一个字打字。
> 证据来源：真机 root shell + 系统固件文件（2026-10-02，固件 appVersion 3.4.6）。
> 所有结论都标了出处，未验证的都注明「待验证」。

## 1. 总体架构：整支笔的 UI 都是 miniapp

`pm list packages` 不适用（定制 Linux，无 Android 包管理），应用清单在
`/userdisk/miniapp/data/mini_app/pkg/packages.json`。桌面、设置、查词翻译、输入法……
全都是 Falcon miniapp。

关键角色的 appid（来自 `packages.json` 的 `category` 字段）：

| appid | 名称 | category | 说明 |
|---|---|---|---|
| `8080222437664451` | 查词翻译 | `HOME` | **桌面**，也是扫描流程的驱动方 |
| `8080252464522508` | 查词翻译 | `SCANTRANS` | **扫描翻译主应用**，`props.Bootup:["lookup"]`、`Preload:true` |
| `8080222501178405` | 下拉菜单 | `TOP_PANEL` | 浮层，不触发 onHide（PenBili profile 已证） |
| `8001666679481944` | 有道输入法 | `Youdao_IM` | 系统输入法 |
| `8080272425914438` | 设置 | `SETTING` | |
| `8002026091900010` | AI对话 | （空） | 本项目；第三方应用 `flag:0`（系统应用是 `flag:3`） |

`props.Bootup` 是「开机要拉起哪些服务」的声明 —— 扫描链路的服务就是靠
SCANTRANS 的 `"Bootup": ["lookup"]` 起来的。

## 2. OCR 引擎（native）

- 目录 `/oem/YoudaoDictPen/output/ocr/`：Cvitek CV1826 的 NPU 模型
  （`yd_rec3404_...cvimodel.encrypt` 47MB 识别模型、`youdao_seg_nearest_...` 5.6MB 切分模型、
  `cascade_0507.xml`、`stroke_table.txt`、`label.skq.23500`）。
- `libs/libcapt.so`（8.9MB，采集）、`libyocr.so`（OCR 封装）、`libyddal_*.so`（业务层）、
  `libmini-nmt.so`（翻译）、`libopencc.so`（简繁）。
- 摄像头采集进程：`/usr/bin/CaptureFrame cherry_auto`（日志 `/userdata/applog/Capframe_*.log`）。
  `cherry` 与 profile 里的 codename 一致。

## 3. 关键发现：`lookup` 服务是扫描结果的转发中枢

`8080252464522508`（SCANTRANS）的 AMR 内含：

```
services/lookup.js.bin                  ← 服务实体（$falcon.Service）
libs/arm-coco/libjsapi_lookup.so        ← lookup JSAPI 模块（native）
libs/arm-coco/libbusiness_lookup.so     ← 业务实现
```

`services/lookup.js` 的字节码字符串（`node tools/dev/strings.js` 提取）显示它是一个
**信号转发服务**：

```js
// 结构（由字符串还原，非原始源码）
$falcon.Service 实现 onCreate / onNewOptions / onDestroy / onDisconnected / onCommand
import lookup_word                    // ← JSAPI 模块名
import getLookupWordManager from './lookupWordManager-8468dffa.js'

// 订阅并转发这些信号（字节码里是一串紧凑字符串，已拆开）：
apolloScanWordResultChanged, requestResultCallBackChanged,
requestFeedbackResultCallBackChanged, currentQueryChanged,
ocrStartChanged, chStrokeImagesChanged, stopContinueScanChanged,
breakListChanged, onAddResultEnd, ancientPoemsOcrStopChanged,
ocrResultChanged, scanWordResultChanged, showNoResultChanged,
scanErrorChanged, scanTextBookResult, cloudOcrStopChanged

// onCommand 支持的动作（日志 'lookup: onCommand action:'）
pageClickReturn, otherAppIndexLookup, queryWbSingleExample, continueLookUp,
setIsNotFirstEnterDictPage, getMoreDictWordResult, moreDictLookUpWord,
backDictWordResult, loadMore, feedBackQueryWords,
queryPronunciationGuideText, getDictNumber, sendHttpLog,
downloadPoemAudioFile/playPoemAudioFile/…(古诗音频),
getCurrentUuid, getCurrentQueryIsTranslate, getSentencePlayState,
queryPhoneticDict, queryAssociation, removeKeyRefNum
```

日志里能直接看到它工作：
`"[JSLookupWordProxy] [queryAssociation] jsapi=lookup=queryAssociation=key=you=result=["`
→ **JSAPI 命名空间就是 `lookup`**（与 profile 里记的 `jsapi: … service …` 一致）。

## 4. 客户端接入 API（框架提供）

`libfalcon.so` 里存在这些字面量（说明是框架级能力，不是某个应用私有）：

```
startService, startServiceAuthorized, startServiceProvider,
sendMessage, hasConnection, onCommand
```

另有 `miniapp_cli startService {appId} {service}` 命令行入口（真机 `miniapp_cli` 帮助里可见）。

`HOME` 应用（`8080222437664451/b/index.js.bin`）里的用法痕迹：

```js
getUseOcrAppIds()            // → 返回可 JSON.parse 的角色表
ocrAppArray = { ui, scantrans, app }
scanAppId = ocrAppArray.??   // headButtonPressNavToOtherApp 时用
// 另外监听：ocrStartChanged / ocrStopChanged / onCurrentAppIdChanged
// 并保存 lastOcrResult / isOcrScaning（有 ocrScaningTimer 防抖）
```

`libjsapi_export.so` 里还有全局注册接口：

```
JSGlobalProxy::addUseOcrAppId(string)      // 注册「我也想收 OCR 结果」
JSGlobalProxy::deleteUseOcrAppId(string)
JSGlobalProxy::getUseOcrAppIds()
YGlobalLookupWordModule::setCurrentAppId / currentAppId / getLastAppId / setNavToAppId
```

## 5. D-Bus 旁路（备选）

- 系统总线 `dbus-daemon --system`（pid 429）；另有会话总线
  `dbus-daemon --config-file=/oem/YoudaoDictPen/output/configs/yd_dbus_session.conf`（pid 662）。
- 该会话总线策略是**全放行**：

```xml
<policy context="default">
  <allow send_destination="*" eavesdrop="true"/>
  <allow eavesdrop="true"/>
  <allow own="*"/>
  <allow user="*"/>
</policy>
```

- miniapp 框架自带 `qjs-dbus.js.bin`（`/etc/miniapp/resources/framework/js_modules/`），
  即 **JS 侧可以直接用 D-Bus**；配合上面的放行策略，可以监听所有消息。
- 待验证：OCR 结果是否也走 D-Bus（还是只走 lookup 服务/JSAPI）。

## 6. ★ 决定性发现：扫描结果全都落在一个 SQLite 库里

**`/userdisk/database/history.db`** → 表 `table_history`（字段已用 Python sqlite3 读出）：

| 字段 | 含义 |
|---|---|
| `word` | **扫描识别出来的原文** |
| `translate` | JSON：`{"pos":"","tran":"译文"}` |
| `dict_type` | 词典类型（实测 406） |
| `src_lang` / `dst_lang` | `zh-CHS` / `en` 等 |
| `wordgroup_type` | 0=整句，4=单词（实测） |
| `timestamp` | 毫秒时间戳 |
| `uploaded` | 是否已上传 |

**真机实证（2026-10-02 实测两次扫描）**：用户先扫英文、再扫中文，库里最新两行正好对应：

```
word      = "一方帮助另一方吵架后和好百生人变朋友"     (zh-CHS→en)
translate = {"pos":"","tran":"After one party helps the other in an argument, they make up and become friends"}
word      = "De Nederlandsche Bank said the gold removed from the US and Canada ..."  (en→zh-CHS)
translate = {"pos":"","tran":"<中文译文>"}
```

同一时刻的应用日志也印证了链路：

```
wordbook: addWordFinish params: {"word":"一方帮助另一方吵架后和好百生人变朋友","src":"zh","dst":"en","bSuc":true,"nErrCode":0}
history: addHistory: 一方帮助另一方吵架后和好百生人变朋友,{"pos":"","tran":"After one party helps ..."},zh,en,406,0
history: onCommand action:addHistory params:...
=scantrans=scanTranslBackClosed=enter          ← 官方流程随后自动回到桌面
scantrans===topAppId===from 8080252464522508 change to 8080222437664451
```

同目录还有 `wordbook.db`（生词本，123 行）、`parentcontrol.db`、`studytimespan.db`。

**这就是接进 AiChat 的最佳数据源**：不用改任何系统应用，只要让 AiChat 能读到这份记录，
就能做到「扫一下 → 切到 AI对话 → 那条文字已经在那里，点一下直接问」。

## 7. ★★ 已确认：第三方应用可以拿到扫描能力（真机实测）

用探针应用在真机上跑出来的结论（appid `8002026091900011`，日志前缀 `[probe]`）：

### 7.1 接入姿势（关键：模块名是 `lookup_word`，不是 `lookup`）

把一个应用做成扫描消费者，只需要三件事：

```js
// 1) 把这两个 .so 放进工程的 libs/（AMR 会打进去，装机后展平成 libs/libjsapi_lookup_<hash>.so）
//    libjsapi_lookup.so      (160760 B)   ← JSAPI 模块
//    libbusiness_lookup.so   (991856 B)   ← 业务实现（缺了模块加载不起来）
//
// 2) 导入：模块名必须是 lookup_word。导出只有一个键：LookupWord（构造函数）
import { LookupWord } from 'lookup_word';

// 3) new 出实例，方法/信号都在实例上（JQObjectTemplate 形态）
const lw = new LookupWord();
```

实测日志：

```
[probe] import "lookup_word" 成功！导出(1): LookupWord
[probe]    lookup_word.LookupWord : function
[probe] new LookupWord() 成功
[probe] 实例成员 58 个: …（26 个信号 + 32 个方法）
```

> 反面证据：`lookup` / `history` / `history_word` / `lookupWord` 全部
> `could not load module filename '…'`；`history` 试了 6 个名字都不行 ——
> 历史记录库那条路走不通，只能走 `lookup_word`。

### 7.2 实例上的 26 个信号（可 `.on(handler)` 订阅）

```
扫描结果类：scanWordResultChanged, scanArticleResultChanged, scanTranslatorResultChanged,
            scanAIReadingResultChanged, scanReciterResultChanged, scanTextBookResult,
            scanChineseBookResult, scanLianZiResultChanged, apolloScanWordResultChanged
OCR 生命周期：ocrStartChanged, ocrStopChanged, cloudOcrStopChanged, ancientPoemsOcrStopChanged,
            onAddResultEnd, showOcrImgResult, showNoResultChanged, scanErrorChanged
交互类：    currentQueryChanged, otherAppQueryChanged, chStrokeImagesChanged,
            stopContinueScanChanged, breakListChanged, requestResultCallBackChanged,
            requestFeedbackResultCallBackChanged, onShowMoreDictButton
```

### 7.3 实例上的 32 个方法

```
读取类：queryOcrResult()          ← ★「上一次扫描结果」的直接入口（无结果时返回空串）
        getDictNumber()           ← 实测返回 0
        getCurrentUuid() / getCurrentQueryIsTranslate() / getSentencePlayState()
        getAutoSelectIndex() / getButtonIsRelease() / isFirstEnterDictPage()
查询类：lookup(...) / queryAssociation(...) / queryPhoneticDict(...) /
        queryWbSingleExample(...) / moreDictLookUpWord(...) / continueLookUp(...) /
        getMoreDictWordResult(...) / backDictWordResult(...) / otherAppIndexLookup(...)
其他：  loadMore / sendHttpLog / pageClickReturn / setIsNotFirstEnterDictPage /
        feedBackQueryWords / queryPronunciationGuideText / removeKeyRefNum / trimPunctuation /
        downloadPoemAudioFile / playPoemAudioFile / downloadPoemExplanationFile /
        playPoemExplanationFile / playPoemUncleKaiFile / downloadPoemUncleKaiFile /
        setAutoSelectIndex
```

### 7.4 `$falcon` 的真实 JSAPI 表面（真机实测，只有三样）

```
$falcon.jsapi = http (request/downloadFile/downloadFileNoCache/downloadAndUnzip),
                modal (alert/confirm/toast/showLoading/hideLoading),
                storage (getStorage/setStorage/removeStorage/clearStorage/
                         getStorageInfo + Global 变体)
```

**没有** `fs`、`lookup`、`history`、`service`、`addUseOcrAppId`。

### 7.5 两个会让整页静默黑屏的坑（都实测踩过）

1. **`import` 一个不存在的模块 → 整页黑，且没有任何日志。**
   框架会去 `/etc/miniapp/resources/framework/js_modules/<名>.js.bin` 找，找不到就
   让页面模块求值失败。实测日志：
   ```
   ERROR fpath(/etc/miniapp/resources/framework/js_modules/fs.js.bin) open failed, errno 2.
   ERROR fpath(/etc/miniapp/resources/framework/js_modules/fs.js) open failed, errno 2.
   ```
   **`fs` 在本固件上不存在**（该目录只有 `events` / `qjs-dbus` / `util`），
   所以 `import fs from 'fs'` 必然黑屏 —— 尽管 doge-reader 的源码里就是这么写的。
   推论：**加载原生模块必须用 try/catch 包住，或放到页面挂载之后再做。**

2. **`app.json` 里把页面指向 `.vue` 时必须同时注册默认页面基类**
   （`$falcon.useDefaultBasePageClass(BasePage)`，见 doge-calculator app.js 的注释）。
   更稳的做法是给每个页面配一个 `.js` 包装，在 `onLoad` 里 `setRootComponent`。

## 8. 下一步

探针 v3 已就绪并在运行：绑定了全部 26 个信号 + 每 2 秒轮询 `queryOcrResult()`。
**只差在笔上扫一段文字**，就能确认：
- 扫描时第 3 方应用会不会收到信号（收到哪个、参数是什么）
- `queryOcrResult()` 是否返回扫描到的文字

拿到结论后，AiChat 就能实现用户要的：**打开应用自动带出上一次扫描记录，
放在输入框旁边，一点就填进对话框**（API Key 那个框同理，扫一下即可填入）。

## 8. ★★★ 真机验证通过：扫描结果已能被第三方应用实时接收

用户实际扫了一句英文，探针（在**前台**，手机端扫描头按下后官方查词页接管屏幕）收到的完整序列：

```
19:45:09.702  ocrStartChanged            → true
19:45:09.716  ocrResultChanged           → (空)
19:45:09.869  ocrResultChanged           → "offer"
19:45:10.133  ocrResultChanged           → "offer someon"
19:45:10.627  ocrResultChanged           → "offer someone a helping hand"   ← 逐字实时增长
19:45:10.966  ocrStopChanged             → "offer someone a helping hand" 1
19:45:11.521  breakListChanged           → {"breakList":[…],"breakListMergeWord":"offersomeonea helping hand",
                                            "src":"en","dst":"zh","scanType":1,…}
19:45:11.526  currentQueryChanged        → "offer someone a helping hand"
19:45:11.553  ocrResultChanged           → (空)        ← 收尾清空
19:45:11.564  scanWordResultChanged      → 301 "向别人伸出援助之手"    ← 官方译文
```

**结论**：
1. 第三方应用能**实时**拿到 OCR 文字（`ocrResultChanged` 是逐字推的，可以做成边扫边显示）。
2. 能拿到语种（`src`/`dst`）与官方译文（`scanWordResultChanged`）。
3. **扫描时应用在后台也照样收到信号** —— 只要应用启动过一次，就能持续接收。
4. `queryOcrResult()` 不能当日志读取用（扫描结束后返回空），
   所以「上一次扫描」必须**自己持久化**（AiChat 就是这么做的，键 `apc_lastscan`）。

AiChat 里的落地（`src/services/scan.js`）：动态 `import('lookup_word')` → `new LookupWord()`
→ 绑 7 个关键信号 → 把「原文/译文/语种/时间」写进 `apc_lastscan`；
对话页输入框左侧显示「最近扫描」卡片（点一下填进输入框）+「刷」刷新按钮；
模型页 API Key 那行下面也有「从扫描填入」。

## 9. 复现用的工具

| 方案 | 做法 | 风险 | 评价 |
|---|---|---|---|
| **A. 读扫描记录** | AiChat 用 `history` JSAPI（或读 `history.db`）取最近扫描，对话页给「最近扫描」入口，一点即问 | **低** | 推荐。已证实数据存在 |
| **B. 注册 OCR 接收** | `addUseOcrAppId('8002026091900010')` 让框架把扫描结果也推给 AiChat | 中 | 探针会验证；成了就是「实时」体验 |
| **C. 连 lookup 服务** | 作为客户端连 `8080252464522508` 的 lookup 服务，订阅 `ocrResultChanged` | 中 | 探针会验证 |
| **D. 改官方应用做二选一** | 重打包 `8080252464522508` / `8080222437664451` 的 AMR | **高** | **不建议**，见下 |

### 关于「改官方应用，扫描后弹二选一」（用户最初的设想）

不建议做，理由都是硬的：

1. 这两个都是**系统应用**（`packages.json` 里 `flag:3`、`SUPPORTUNINSTALL:false`、
   SCANTRANS 还 `Preload:true` + `Bootout:["lookup"]`）。
2. 产物是 **QuickJS 字节码**（`.js.bin`），**没有源码**。想在扫描完成处插入一个选择器，
   等于要改编译后的字节码 —— 不现实；改坏会让扫描/查词整个不可用。
3. 即便改成功，**固件升级会覆盖**，而且这两条链路还牵着 wordbook / history / 输入法。

**用方案 A 可以达到同样的用户体验**（甚至更顺）：官方翻译照旧不被打断，
你扫完想用 AI 时切到「AI对话」，那条扫描文字已经躺在那里，一点就问 —— 零打字。

## 10. 下一步（需要真机配合）

1. 重新插上笔（当前已断开），我把 `probe-scan` 装上；
2. 你打开探针 → 扫一段文字 → 回探针页；
3. 我读 `[probe]` 日志，确定 `history` / `lookup` 的可用性与调用形态；
4. 按结论把「最近扫描 → 一键问 AI」并进 AiChat。

## 11. 复现用的工具

```
tools/dev/strings.js    <file> [关键字...]      从二进制/字节码抽字符串并检索
tools/dev/jsnames.js    <file> [--all]          抽「像 JS 标识符」的名字（还原 JSAPI）
tools/dev/context.js    <file> <关键字> --win N   打印关键字周围的字符串，还原代码片段
tools/dev/inspect_db.py [db...]                 看 SQLite 表结构与最新若干行
tools/dev/recon_*.sh                            真机侦察脚本（推送到 /tmp 执行）
```

真机侦察命令备忘：

```bash
adb push tools/dev/recon_apps.sh /tmp/ && adb shell sh /tmp/recon_apps.sh      # 应用清单
adb shell "cat /userdisk/miniapp/data/mini_app/pkg/packages.json"             # 注册表
adb pull /userdisk/database/history.db .                                      # 扫描记录
adb shell "tail -n +<基线行号> /userdata/applog/DictPen_*.log | grep console.warn"
```
