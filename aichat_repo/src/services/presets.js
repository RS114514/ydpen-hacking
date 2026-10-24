// 服务商预设目录（**纯数据**，方便单独维护）。
//
// ⚠️ AI 服务商的 Base URL 与模型名迭代很快（例：`deepseek-chat` / `deepseek-reasoner`
// 已于 2026-07-24 下线，现在是 `deepseek-flash` / `deepseek-v4-pro`）。
// 因此这里给的是「开箱可用」的起点，**每一条在界面上都能改**：
//   Base URL / 模型名 / API Key / 请求头 / 附加 JSON / 思考方言 全部可编辑，
//   模型页还能一键 GET /models 拉取该端点真实可用的模型名来选。
//
// thinkStyle 取值见 config.js 的 THINK_STYLES：
//   'none'             不发送思考参数（模型自身固定行为，如「永远思考」的档位）
//   'model'            思考开关 = 切换模型名（thinkModel / fastModel）
//   'reasoning_effort' 发送 reasoning_effort（取值受 effortOptions 限制）
//   'enable_thinking'  发送 enable_thinking: true|false（可带 thinking_budget）
//   'thinking_object'  发送 thinking: {type:'enabled'|'disabled', budget_tokens?}
//
// 字段说明：
//   omitTemperature        该模型不接受 temperature（Kimi 是「传了就报错」，必须省）
//   omitTopP               该模型不接受 top_p
//   maxTokensField         'max_tokens' | 'max_completion_tokens'
//   maxTokensOverride      >0 时覆盖全局「最大输出」（如 Kimi 建议 ≥16000）
//   effortOptions          reasoning_effort 的合法取值（逗号分隔），用于界面收窄选项
//   effortWithThinking     思考开关用 thinking 对象、强度另用 reasoning_effort（DeepSeek 是这样）
//   tempIgnoredWhenThinking 思考模式下 temperature 被忽略（DeepSeek 明确如此）→ 界面提示

export const PRESETS = [
  {
    id: 'deepseek',
    vendor: 'DeepSeek 深度求索',
    baseUrl: 'https://api.deepseek.com',
    note: '官方文档：POST /chat/completions，思考默认开启，用 thinking.type 切换；思考模式下 temperature 不生效',
    models: [
      {
        key: 'deepseek-flash',
        label: 'DeepSeek Flash 快答',
        model: 'deepseek-flash',
        thinkStyle: 'thinking_object',
        effortWithThinking: true,
        effortOptions: 'low,high,max',
        tempIgnoredWhenThinking: true,
        note: 'V4.1-Flash，1M 上下文；关掉思考时响应很快，适合日常问答'
      },
      {
        key: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro 思考',
        model: 'deepseek-v4-pro',
        thinkStyle: 'thinking_object',
        effortWithThinking: true,
        effortOptions: 'low,high,max',
        tempIgnoredWhenThinking: true,
        note: 'V4-Pro，默认就思考；思考过程会显示在「思考过程」块里'
      }
    ]
  },
  {
    id: 'openai',
    vendor: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    note: '注意：OpenAI 的 /chat/completions 不返回思考正文（思考摘要只在 Responses API），所以这里思考块会是空的',
    models: [
      {
        key: 'openai-fast',
        label: 'OpenAI 快答',
        model: 'gpt-5.4-mini',
        thinkStyle: 'none',
        maxTokensField: 'max_completion_tokens',
        note: '不支持调思考；换模型名可自行改成其它可用档'
      },
      {
        key: 'openai-reason',
        label: 'OpenAI 推理',
        model: 'gpt-5.4',
        thinkStyle: 'reasoning_effort',
        effortOptions: 'none,minimal,low,medium,high,xhigh,max',
        maxTokensField: 'max_completion_tokens',
        omitTemperature: true,
        note: '用 reasoning_effort 调思考强度；推理档只接受默认温度，故不发 temperature。思考正文拿不到（平台限制）'
      }
    ]
  },
  {
    id: 'zhipu',
    vendor: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    note: 'GLM 的 thinking/参数限制随版本变化很快，遇 400 请按报错改这里的高级选项',
    models: [
      {
        key: 'glm-flash',
        label: 'GLM Flash 快答',
        model: 'glm-4.5-flash',
        thinkStyle: 'none',
        note: '轻量档；GLM 部分型号「强制思考」，无法关闭，故不发送思考参数'
      },
      {
        key: 'glm-think',
        label: 'GLM 思考',
        model: 'glm-5.3',
        thinkStyle: 'reasoning_effort',
        effortOptions: 'low,high,max',
        note: 'GLM-5.3 只能 low/high/max，且不支持关闭思考（传 disabled 会报错）'
      }
    ]
  },
  {
    id: 'moonshot',
    vendor: 'Kimi 月之暗面',
    baseUrl: 'https://api.moonshot.ai/v1',
    note: 'Kimi 的 temperature/top_p 是固定值，传了会报错，所以这里已设为不发送；思考档较费 token',
    models: [
      {
        key: 'kimi-fast',
        label: 'Kimi 快答',
        model: 'kimi-k2.6',
        thinkStyle: 'thinking_object',
        omitTemperature: true,
        omitTopP: true,
        maxTokensOverride: 16000,
        note: '可关思考；输出上限已按官方建议设为 16000（思考也占额度）'
      },
      {
        key: 'kimi-think',
        label: 'Kimi K3 思考',
        model: 'kimi-k3',
        thinkStyle: 'reasoning_effort',
        effortOptions: 'low,high,max',
        omitTemperature: true,
        omitTopP: true,
        maxTokensOverride: 16000,
        note: 'K3 不接受 thinking 字段，用 reasoning_effort 调档'
      }
    ]
  },
  {
    id: 'qwen',
    vendor: '通义千问（兼容模式）',
    baseUrl: 'https://maas.qwencloudapi.com/compatible-mode/v1',
    note: '⚠️ 千问多数模型在「非流式」请求下禁止开思考；要思考请用 qwen3-max / qwen3.7-max 这类支持非流式的档',
    models: [
      {
        key: 'qwen-fast',
        label: 'Qwen 快答',
        model: 'qwen3.8-flash',
        thinkStyle: 'enable_thinking',
        note: '关思考（enable_thinking=false）→ 非流式可用；开思考可能被服务端拒绝'
      },
      {
        key: 'qwen-think',
        label: 'Qwen 思考',
        model: 'qwen3-max',
        thinkStyle: 'enable_thinking',
        note: '支持非流式思考的档位；思考预算用「思考预算」调（与 reasoning_effort 互斥）'
      }
    ]
  },
  {
    id: 'siliconflow',
    vendor: '硅基流动 SiliconFlow',
    baseUrl: 'https://api.siliconflow.com/v1',
    note: '模型名带组织前缀（deepseek-ai/…）；该站错误体格式不统一，本应用已做兼容解析',
    models: [
      {
        key: 'sf-flash',
        label: '硅基 DS 快答',
        model: 'deepseek-ai/DeepSeek-V4-Flash',
        thinkStyle: 'enable_thinking',
        note: '聚合站的 Flash 档'
      },
      {
        key: 'sf-pro',
        label: '硅基 DS 思考',
        model: 'deepseek-ai/DeepSeek-V4-Pro',
        thinkStyle: 'enable_thinking',
        note: '聚合站的 Pro 档（思考），思考过程会显示出来'
      }
    ]
  },
  {
    id: 'custom',
    vendor: '自定义（OpenAI 兼容）',
    baseUrl: '',
    note: '任何 OpenAI 兼容端点：局域网 Ollama / LM Studio / one-api 网关 / 自建服务（笔和电脑同一 WiFi 可直连）',
    models: [
      {
        key: 'custom-1',
        label: '自定义模型',
        model: '',
        thinkStyle: 'none',
        note: 'Base URL 填到 /v1 为止，模型名照抄服务商文档；也可用「拉取模型列表」直接选'
      }
    ]
  }
];

// 首次启动启用的档位（保持首屏干净，其余在模型页按需添加）
export const DEFAULT_ENABLED_KEYS = ['deepseek-flash', 'deepseek-v4-pro'];

export function findPresetModel(key) {
  for (let i = 0; i < PRESETS.length; i++) {
    const p = PRESETS[i];
    for (let j = 0; j < p.models.length; j++) {
      if (p.models[j].key === key) return { preset: p, model: p.models[j] };
    }
  }
  return null;
}

export function allPresetModels() {
  const out = [];
  PRESETS.forEach((p) => {
    p.models.forEach((m) => out.push({ preset: p, model: m }));
  });
  return out;
}
