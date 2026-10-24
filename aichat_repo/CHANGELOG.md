# Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## v1.0.0 — 首个可用版本

在有道词典笔 X5（YDPX5-1，Falcon mini-app / QuickJS）上跑的 AI 对话客户端。

### 核心能力

- **多服务商 / 多模型切换**：DeepSeek、OpenAI，以及任意 OpenAI 兼容端点
  （GLM / Kimi / Qwen / SiliconFlow 等已内置预设），模型可增删改、可从服务商
  拉取真实模型名、可做连通性测试
- **思考（reasoning）参数**：按服务商「方言」自动翻译成对应的请求字段
  （`thinking.type` / `reasoning_effort` / `enable_thinking` / 独立思考档模型），
  并能在界面上折叠回看思考过程
- **多轮对话**：Markdown 降级渲染（标题/列表/引用/代码块/表格）、超时与停止、
  失败重试、上下文轮数可调
- **扫描取词代替手打**：直接用笔的扫描头扫一段文字，文字实时进到应用里
  （`ocrResultChanged` 逐字推送），输入框左侧卡片一点即填入；
  模型页的 API Key 也可「扫一下填入」
- **免打字配置**：`tools/seed.js` 可把模型与参数直接写进设备存储，省去在笔上打字
- **链路自检**：存储 → 原生传输 → 配置 → 真实 API 调用，逐步写设备日志

### 平台适配（均为真机实证，见 README §4 与 `docs/reverse-scan-ocr.md`）

- 传输层：`libjsapi_httpjson.so` 是唯一能发 JSON POST + 自定义请求头并读到错误响应的
  通道；补了 `Expect:` 头绕过 libcurl 100-continue，并预热单线程初始化避免竞态
- 扫描接入：模块名是 `lookup_word`（不是 `lookup`），导出 `LookupWord` 构造函数，
  方法与 26 个信号都在实例上；扫描结果需自行持久化（第三方应用拿不到 `fs`）
- 识别并规避两个**静默黑屏**陷阱：`import` 不存在的模块、模板属性里的未转义双引号
  → 分别加了 `tools/check-imports.js` 与 `tools/check-templates.js` 两道构建门禁
- UI：深色 AI 助手风格，两个页面（对话 + 面板），三个区块在面板内原地切换，
  无页面栈跳转闪动

### 测试

- `test/run.mjs`：167 项离线断言（配置归一化、各家思考方言 → 请求体字段、
  错误体归一、Markdown 解析、脱敏等）
- 真机验证：DeepSeek 实际对话、扫描取词、装包与截图
