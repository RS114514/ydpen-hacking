// 配置 schema：模型条目 + 生成参数。所有对外读取都过 normalize，
// 保证旧版本配置、损坏 JSON、缺字段都不会把脏值带进请求体。

import { PRESETS, DEFAULT_ENABLED_KEYS, findPresetModel } from './presets.js';
import { uid, clampNum, normalizeBaseUrl, safeJsonParse } from './util.js';

export const CONFIG_SCHEMA_VERSION = 1;

// 「思考」在不同服务商是不同字段 → 用方言(style)描述怎么表达开/关
export const THINK_STYLES = [
  { id: 'none', label: '不发送', hint: '不带任何思考参数（模型自身固定行为）' },
  { id: 'model', label: '切换模型名', hint: '思考/非思考是两个模型名，靠改名切换' },
  { id: 'reasoning_effort', label: 'reasoning_effort', hint: 'OpenAI 推理系列：minimal/low/medium/high' },
  { id: 'enable_thinking', label: 'enable_thinking', hint: '通义/GLM 等兼容端点：true/false（可带预算）' },
  { id: 'thinking_object', label: 'thinking 对象', hint: 'thinking:{type:enabled|disabled, budget_tokens}' }
];

export const THINK_STYLE_IDS = THINK_STYLES.map((s) => s.id);

export const EFFORT_OPTIONS = [
  { id: 'none', label: '关' },
  { id: 'minimal', label: '最小' },
  { id: 'low', label: '低' },
  { id: 'medium', label: '中' },
  { id: 'high', label: '高' },
  { id: 'xhigh', label: '极高' },
  { id: 'max', label: '最大' }
];

export const EFFORT_IDS = EFFORT_OPTIONS.map((e) => e.id);

export function effortLabel(id) {
  for (let i = 0; i < EFFORT_OPTIONS.length; i++) {
    if (EFFORT_OPTIONS[i].id === id) return EFFORT_OPTIONS[i].label;
  }
  return id || '';
}

// 模型自己的 reasoning_effort 合法取值（逗号分隔）；空 = 不限制
export function parseEffortOptions(text) {
  if (!text) return [];
  const out = [];
  String(text)
    .split(',')
    .forEach((s) => {
      const t = s.trim();
      if (t && EFFORT_IDS.indexOf(t) >= 0 && out.indexOf(t) < 0) out.push(t);
    });
  return out;
}

export const MAXTOKENS_FIELDS = [
  { id: 'max_tokens', label: 'max_tokens' },
  { id: 'max_completion_tokens', label: 'max_completion_tokens' }
];

export const LIMITS = {
  temperature: { min: 0, max: 2, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.05 },
  maxTokens: { min: 64, max: 32768, step: 64 },
  // 单模型覆盖值放宽（Kimi 官方建议 ≥16000，DeepSeek 允许到 384K）
  maxTokensOverride: { min: 0, max: 131072 },
  historyRounds: { min: 0, max: 20, step: 1 },
  timeoutSec: { min: 15, max: 300, step: 5 },
  thinkBudget: { min: 0, max: 16384, step: 256 }
};

export const DEFAULT_SYSTEM_PROMPT =
  '你是有道词典笔上的 AI 助手，屏幕很小。回答要简洁、口语化、条理清楚，默认用中文；' +
  '解释英文单词时给出音标、词性和一个例句；除用户明确要求展开，篇幅控制在 200 字以内，' +
  '少用 Markdown 语法和表格。';

export const DEFAULT_PARAMS = {
  temperature: 0.7,
  useTopP: false,
  topP: 1,
  maxTokens: 1024,
  historyRounds: 4,
  timeoutSec: 90,
  think: 'off', // off | on
  thinkEffort: 'medium',
  thinkBudget: 1024,
  systemPrompt: DEFAULT_SYSTEM_PROMPT
};

function num(v, min, max, fallback) {
  return clampNum(v, min, max, fallback);
}

export function normalizeParams(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const L = LIMITS;
  return {
    temperature: num(r.temperature, L.temperature.min, L.temperature.max, DEFAULT_PARAMS.temperature),
    useTopP: r.useTopP === true,
    topP: num(r.topP, L.topP.min, L.topP.max, DEFAULT_PARAMS.topP),
    maxTokens: Math.round(num(r.maxTokens, L.maxTokens.min, L.maxTokens.max, DEFAULT_PARAMS.maxTokens)),
    historyRounds: Math.round(
      num(r.historyRounds, L.historyRounds.min, L.historyRounds.max, DEFAULT_PARAMS.historyRounds)
    ),
    timeoutSec: Math.round(num(r.timeoutSec, L.timeoutSec.min, L.timeoutSec.max, DEFAULT_PARAMS.timeoutSec)),
    think: r.think === 'on' ? 'on' : 'off',
    thinkEffort: EFFORT_OPTIONS.some((e) => e.id === r.thinkEffort) ? r.thinkEffort : DEFAULT_PARAMS.thinkEffort,
    thinkBudget: Math.round(num(r.thinkBudget, L.thinkBudget.min, L.thinkBudget.max, DEFAULT_PARAMS.thinkBudget)),
    systemPrompt: typeof r.systemPrompt === 'string' ? r.systemPrompt : DEFAULT_PARAMS.systemPrompt
  };
}

export function normalizeModel(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const style = THINK_STYLE_IDS.indexOf(r.thinkStyle) >= 0 ? r.thinkStyle : 'none';
  return {
    id: typeof r.id === 'string' && r.id ? r.id : uid('m'),
    key: typeof r.key === 'string' ? r.key : '',
    label: typeof r.label === 'string' && r.label.trim() ? r.label.trim() : '未命名模型',
    vendor: typeof r.vendor === 'string' ? r.vendor : '',
    baseUrl: normalizeBaseUrl(r.baseUrl),
    apiKey: typeof r.apiKey === 'string' ? r.apiKey : '',
    model: typeof r.model === 'string' ? r.model.trim() : '',
    thinkStyle: style,
    fastModel: typeof r.fastModel === 'string' ? r.fastModel.trim() : '',
    thinkModel: typeof r.thinkModel === 'string' ? r.thinkModel.trim() : '',
    maxTokensField: r.maxTokensField === 'max_completion_tokens' ? 'max_completion_tokens' : 'max_tokens',
    omitTemperature: r.omitTemperature === true,
    omitTopP: r.omitTopP === true,
    // 该模型 reasoning_effort 的合法取值（逗号分隔，空=不限制）
    effortOptions: typeof r.effortOptions === 'string' ? r.effortOptions : '',
    // 思考开关用 thinking 对象、但强度用 reasoning_effort 的厂商（DeepSeek 就是这样）
    effortWithThinking: r.effortWithThinking === true,
    // >0 时覆盖全局「最大输出」（例：Kimi 官方建议 ≥16000，因为思考也占额度）
    maxTokensOverride: Math.round(num(r.maxTokensOverride, 0, LIMITS.maxTokensOverride.max, 0)),
    // 思考模式下 temperature 被服务端忽略（DeepSeek 明确如此）→ 界面给提示，避免用户白调
    tempIgnoredWhenThinking: r.tempIgnoredWhenThinking === true,
    extraHeaders: typeof r.extraHeaders === 'string' ? r.extraHeaders : '',
    extraBody: typeof r.extraBody === 'string' ? r.extraBody : '',
    note: typeof r.note === 'string' ? r.note : ''
  };
}

// 从预设目录实例化一条模型配置
export function modelFromPreset(key, apiKey) {
  const hit = findPresetModel(key);
  if (!hit) return null;
  const m = hit.model;
  return normalizeModel({
    key: m.key,
    label: m.label,
    vendor: hit.preset.vendor,
    baseUrl: hit.preset.baseUrl,
    apiKey: apiKey || '',
    model: m.model,
    thinkStyle: m.thinkStyle,
    fastModel: m.fastModel || m.model,
    thinkModel: m.thinkModel || m.model,
    maxTokensField: m.maxTokensField,
    omitTemperature: m.omitTemperature,
    omitTopP: m.omitTopP,
    effortOptions: m.effortOptions || '',
    effortWithThinking: m.effortWithThinking,
    maxTokensOverride: m.maxTokensOverride || 0,
    tempIgnoredWhenThinking: m.tempIgnoredWhenThinking,
    note: m.note || hit.preset.note || ''
  });
}

export function defaultConfig() {
  const models = [];
  DEFAULT_ENABLED_KEYS.forEach((k) => {
    const m = modelFromPreset(k);
    if (m) models.push(m);
  });
  return {
    version: CONFIG_SCHEMA_VERSION,
    activeId: models.length > 0 ? models[0].id : '',
    models: models,
    params: normalizeParams(null)
  };
}

export function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') return defaultConfig();
  const models = Array.isArray(raw.models) ? raw.models.map(normalizeModel).filter((m) => m.baseUrl || m.model) : [];
  const cfg = {
    version: CONFIG_SCHEMA_VERSION,
    activeId: typeof raw.activeId === 'string' ? raw.activeId : '',
    models: models.length > 0 ? models : defaultConfig().models,
    params: normalizeParams(raw.params)
  };
  if (!cfg.models.some((m) => m.id === cfg.activeId)) {
    cfg.activeId = cfg.models.length > 0 ? cfg.models[0].id : '';
  }
  return cfg;
}

export function findModel(cfg, id) {
  if (!cfg || !cfg.models) return null;
  for (let i = 0; i < cfg.models.length; i++) {
    if (cfg.models[i].id === id) return cfg.models[i];
  }
  return null;
}

export function activeModel(cfg) {
  return findModel(cfg, cfg && cfg.activeId) || (cfg && cfg.models && cfg.models[0]) || null;
}

// ---- 请求体构造：把「模型配置 + 参数」翻译成服务商能懂的字段 ----
// 返回 { body, notes, hints }
//   notes = 本次实际发出的思考相关字段（显示在状态区，便于排查）
//   hints = 给用户的提醒（如「思考模式下温度不生效」）
export function buildRequestBody(model, params, messages) {
  const p = normalizeParams(params);
  const m = normalizeModel(model);
  const body = {
    model: m.model,
    messages: messages,
    stream: false // 设备传输层拿不到分块，永远非流式
  };
  const notes = [];
  const hints = [];
  const thinkOn = p.think === 'on';

  // 思考方言
  switch (m.thinkStyle) {
    case 'model': {
      const fast = m.fastModel || m.model;
      const think = m.thinkModel || m.model;
      body.model = thinkOn ? think : fast;
      notes.push(thinkOn ? '模型=' + think : '模型=' + fast);
      break;
    }
    case 'reasoning_effort': {
      // 只发该模型声明支持的取值；不支持 none 的模型（如 GLM-5.3）关思考时不发该字段
      const allowed = parseEffortOptions(m.effortOptions);
      let eff = p.thinkEffort;
      if (allowed.length > 0 && allowed.indexOf(eff) < 0) {
        eff = allowed.indexOf('high') >= 0 ? 'high' : allowed[allowed.length - 1];
      }
      const canDisable = allowed.length === 0 || allowed.indexOf('none') >= 0;
      if (thinkOn) {
        body.reasoning_effort = eff;
        notes.push('reasoning_effort=' + eff);
      } else if (canDisable) {
        body.reasoning_effort = 'none';
        notes.push('reasoning_effort=none（关思考）');
      } else {
        notes.push('该模型不支持关思考，未发送 reasoning_effort');
        hints.push('这个档位无法关闭思考，仍会输出思考过程');
      }
      break;
    }
    case 'enable_thinking': {
      body.enable_thinking = thinkOn;
      if (thinkOn && p.thinkBudget > 0) body.thinking_budget = p.thinkBudget;
      notes.push(
        thinkOn ? 'enable_thinking=true' + (p.thinkBudget > 0 ? ' budget=' + p.thinkBudget : '') : 'enable_thinking=false'
      );
      if (thinkOn) hints.push('部分服务商在「非流式」请求下会拒绝开思考，遇 400 请关掉思考或换档');
      break;
    }
    case 'thinking_object': {
      // 只发 {type}：DeepSeek 等厂商的 thinking 对象**只文档了 type**，
      // 多塞 budget_tokens 有被严格校验拒绝的风险（要预算的网关请用「附加参数JSON」）。
      body.thinking = { type: thinkOn ? 'enabled' : 'disabled' };
      notes.push('thinking=' + body.thinking.type);
      if (thinkOn && m.effortWithThinking) {
        const allowed2 = parseEffortOptions(m.effortOptions);
        let eff2 = p.thinkEffort;
        if (allowed2.length > 0 && allowed2.indexOf(eff2) < 0) {
          eff2 = allowed2.indexOf('high') >= 0 ? 'high' : allowed2[allowed2.length - 1];
        }
        body.reasoning_effort = eff2;
        notes.push('reasoning_effort=' + eff2);
      }
      break;
    }
    default: {
      notes.push('不发送思考参数');
      break;
    }
  }

  // 采样与长度
  if (!m.omitTemperature) body.temperature = p.temperature;
  if (p.useTopP && !m.omitTopP) body.top_p = p.topP;
  if (m.omitTemperature) hints.push('该模型不接受 temperature，已不发送');
  if (thinkOn && m.tempIgnoredWhenThinking) hints.push('思考模式下 temperature 不生效（服务商行为）');
  const maxTok = m.maxTokensOverride > 0 ? m.maxTokensOverride : p.maxTokens;
  body[m.maxTokensField === 'max_completion_tokens' ? 'max_completion_tokens' : 'max_tokens'] = maxTok;

  // 高级：附加请求体（用户自己写 JSON，可覆盖上面任何字段）
  if (m.extraBody && m.extraBody.trim()) {
    const extra = safeJsonParse(m.extraBody, null);
    if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
      Object.keys(extra).forEach((k) => {
        body[k] = extra[k];
      });
      notes.push('已合并附加参数');
    } else {
      notes.push('附加参数不是合法 JSON，已忽略');
    }
  }

  return { body: body, notes: notes, hints: hints };
}
