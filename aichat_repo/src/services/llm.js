// LLM 调用层：把「模型配置 + 参数 + 对话历史」变成一次 OpenAI 兼容的
// POST /chat/completions，并把各种失败翻译成用户能看懂的一句话。
//
// 请求形态（真机可用性由 native httpjson 保证，见 services/net.js 顶部注释）：
//   POST {baseUrl}/chat/completions
//   Authorization: Bearer <key> / Content-Type: application/json
//   {"model":…,"messages":[…],"stream":false,…}
//
// 不做流式：设备传输层只能整包返回（takeResult 语义），所以一律 stream:false。

import { postJson, getJson, statusText, curlCodeText } from './net.js';
import { buildRequestBody, normalizeParams, normalizeModel, activeModel } from './config.js';
import { chatCompletionsUrl, modelsUrl, parseHeaderLines, maskKey, clipText } from './util.js';
import { estimateMessagesTokens } from './markdown.js';
import { logWarn } from './storage.js';

// 组装发给模型的消息数组：system + 最近 N 轮 + 本轮提问
export function buildMessages(cfg, history, userText) {
  const p = normalizeParams(cfg && cfg.params);
  const msgs = [];
  const sys = (p.systemPrompt || '').trim();
  if (sys) msgs.push({ role: 'system', content: sys });

  const list = Array.isArray(history) ? history : [];
  // history 里只保留已完成的 user/assistant 文本轮次；
  // 被用户停止(cancelled)或报错(error)的记录不进上下文，避免把半截话喂给模型
  const turns = list.filter(
    (m) =>
      m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.text === 'string' &&
      m.text &&
      !m.cancelled &&
      !m.error
  );
  const keep = p.historyRounds * 2;
  const picked = keep > 0 ? turns.slice(Math.max(0, turns.length - keep)) : [];
  picked.forEach((m) => msgs.push({ role: m.role, content: m.text }));

  if (userText) msgs.push({ role: 'user', content: userText });
  return msgs;
}

export function requestHeaders(model, apiKeyOverride) {
  const m = normalizeModel(model);
  const key = typeof apiKeyOverride === 'string' ? apiKeyOverride : m.apiKey;
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = 'Bearer ' + key;
  const extra = parseHeaderLines(m.extraHeaders);
  Object.keys(extra).forEach((k) => {
    headers[k] = extra[k];
  });
  return headers;
}

// 配置是否具备发请求的最低条件
export function validateModel(model) {
  const m = normalizeModel(model);
  const problems = [];
  if (!m.baseUrl) problems.push('未填 Base URL');
  else if (!/^https?:\/\//i.test(m.baseUrl)) problems.push('Base URL 必须以 http:// 或 https:// 开头');
  if (!m.model) problems.push('未填模型名');
  if (!m.apiKey) problems.push('未填 API Key');
  return { ok: problems.length === 0, problems: problems };
}

// 服务商错误体 → 一句话
export function extractApiError(r) {
  const j = r && r.json;
  if (j && typeof j === 'object') {
    const e = j.error;
    if (typeof e === 'string' && e) return e;
    if (e && typeof e === 'object') {
      if (typeof e.message === 'string' && e.message) return e.message;
      if (typeof e.code === 'string' && e.code) return e.code;
      if (e.code !== undefined) return '错误码 ' + e.code;
    }
    if (typeof j.message === 'string' && j.message) return j.message;
    if (typeof j.msg === 'string' && j.msg) return j.msg;
    if (typeof j.detail === 'string' && j.detail) return j.detail;
    if (j.detail) {
      try {
        return clipText(JSON.stringify(j.detail), 200);
      } catch (err) {
        /* 忽略 */
      }
    }
  }
  if (r && typeof r.body === 'string' && r.body.trim()) {
    const t = r.body.replace(/\s+/g, ' ').trim();
    if (t.charAt(0) === '<') return '服务端返回了 HTML（多半是地址不对或需要代理）';
    return clipText(t, 200);
  }
  return '';
}

// 把一次失败响应翻译成 { message, detail, kind }
export function describeFailure(r) {
  const status = r && r.status ? r.status : 0;
  const apiMsg = extractApiError(r);
  if (status === 0) {
    const t = curlCodeText(r && r.curlCode);
    return { kind: 'network', message: t, detail: (r && r.error) || '' };
  }
  const head = statusText(status);
  return { kind: status >= 500 ? 'server' : 'request', message: head, detail: apiMsg };
}

function pickString(obj, keys) {
  for (let i = 0; i < keys.length; i++) {
    const v = obj[keys[i]];
    if (typeof v === 'string' && v) return v;
  }
  return '';
}

// 从 message 里取正文（兼容 content 为字符串或分片数组）
function extractContent(msg) {
  if (!msg) return '';
  const c = msg.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    let out = '';
    c.forEach((part) => {
      if (typeof part === 'string') out += part;
      else if (part && typeof part.text === 'string') out += part.text;
      else if (part && typeof part.content === 'string') out += part.content;
    });
    return out;
  }
  if (c && typeof c === 'object' && typeof c.text === 'string') return c.text;
  return '';
}

// 从 message 里取思考过程（各家字段名不同）
function extractReasoning(msg) {
  if (!msg) return '';
  const direct = pickString(msg, ['reasoning_content', 'reasoning', 'thinking_content', 'reasoning_text']);
  if (direct) return direct;
  const th = msg.thinking;
  if (typeof th === 'string') return th;
  if (th && typeof th === 'object') {
    const s = pickString(th, ['content', 'text', 'reasoning_content']);
    if (s) return s;
  }
  const r = msg.reasoning;
  if (r && typeof r === 'object') {
    const s = pickString(r, ['content', 'text', 'summary']);
    if (s) return s;
  }
  return '';
}

// 有些服务端把思考放在 choices[0].message 之外
function extractReasoningFallback(choice, json) {
  if (choice && typeof choice.reasoning_content === 'string' && choice.reasoning_content) return choice.reasoning_content;
  if (json && typeof json.reasoning_content === 'string') return json.reasoning_content;
  return '';
}

function normalizeUsage(u) {
  if (!u || typeof u !== 'object') return null;
  const p = Number(u.prompt_tokens) || 0;
  const c = Number(u.completion_tokens) || 0;
  const t = Number(u.total_tokens) || p + c;
  if (!p && !c && !t) return null;
  return { prompt: p, completion: c, total: t };
}

// 单轮对话。
// 返回 { ok, text, reasoning, usage, ms, finishReason, model, error:{message,detail,kind}, contextTokens }
export async function chat(cfg, opts) {
  const o = opts || {};
  const model = o.model || activeModel(cfg);
  const params = normalizeParams(cfg && cfg.params);
  const m = normalizeModel(model);

  const v = validateModel(m);
  if (!v.ok) {
    return {
      ok: false,
      error: { kind: 'config', message: '模型未配置完整', detail: v.problems.join('；') },
      ms: 0
    };
  }

  const messages = buildMessages(cfg, o.history, o.userText);
  const built = buildRequestBody(m, params, messages);
  const url = chatCompletionsUrl(m.baseUrl);
  const contextTokens = estimateMessagesTokens(messages);

  logWarn(
    '[llm] 请求 model=' + built.body.model + ' msgs=' + messages.length +
      ' ctx≈' + contextTokens + 'tok key=' + maskKey(m.apiKey) +
      ' think=' + (params.think === 'on' ? 'on' : 'off') + ' style=' + m.thinkStyle
  );

  let r;
  try {
    r = await postJson(url, built.body, {
      headers: requestHeaders(m),
      timeoutMs: params.timeoutSec * 1000
    });
  } catch (e) {
    return {
      ok: false,
      error: { kind: 'network', message: '请求未能发出', detail: (e && e.message) || String(e) },
      ms: 0,
      contextTokens: contextTokens
    };
  }

  if (!r.ok) {
    const f = describeFailure(r);
    logWarn('[llm] 失败 status=' + r.status + ' kind=' + f.kind + ' detail=' + clipText(f.detail, 120));
    return {
      ok: false,
      error: f,
      ms: r.ms,
      status: r.status,
      curlCode: r.curlCode,
      transport: r.transport,
      insecure: r.insecure,
      contextTokens: contextTokens,
      requestBody: built
    };
  }

  const json = r.json;
  if (!json || typeof json !== 'object') {
    return {
      ok: false,
      error: { kind: 'protocol', message: '返回内容不是 JSON', detail: clipText(r.body || '', 200) },
      ms: r.ms,
      status: r.status,
      transport: r.transport,
      requestBody: built
    };
  }

  const choices = Array.isArray(json.choices) ? json.choices : [];
  const choice = choices.length > 0 ? choices[0] : null;
  const msg = choice && choice.message ? choice.message : null;
  const text = extractContent(msg);
  const reasoning = extractReasoning(msg) || extractReasoningFallback(choice, json);
  const finishReason = (choice && choice.finish_reason) || '';

  if (!text && !reasoning) {
    // 200 但没有内容：多数是服务端用 200 包了一个错误
    const apiMsg = extractApiError(r);
    return {
      ok: false,
      error: {
        kind: 'protocol',
        message: '返回里没有内容',
        detail: apiMsg || clipText(JSON.stringify(json), 200)
      },
      ms: r.ms,
      status: r.status,
      transport: r.transport,
      requestBody: built
    };
  }

  logWarn(
    '[llm] 成功 ms=' + r.ms + ' textLen=' + text.length + ' reasonLen=' + reasoning.length +
      ' finish=' + finishReason + (r.insecure ? ' insecure=1' : '')
  );

  return {
    ok: true,
    text: text,
    reasoning: reasoning,
    finishReason: finishReason,
    usage: normalizeUsage(json.usage),
    ms: r.ms,
    status: r.status,
    transport: r.transport,
    insecure: r.insecure,
    model: json.model || built.body.model,
    contextTokens: contextTokens,
    requestBody: built
  };
}

// 连通性自检：最小代价的一次真实调用。
// 同时把 buildRequestBody 算出来的 notes/hints 带出来——那些是「这次实际发了什么
// 思考相关字段」以及「该厂商的已知限制」，界面必须能看到，否则用户只会看到
// 一句「参数不被接受」而不知道该改哪里。
export async function testModel(model, params) {
  const t0 = Date.now();
  const cfg = { models: [normalizeModel(model)], activeId: normalizeModel(model).id, params: params };
  const r = await chat(cfg, { userText: '你好', history: [] });
  const built = r.requestBody || {};
  return {
    ok: r.ok,
    ms: r.ms || Date.now() - t0,
    status: r.status,
    transport: r.transport,
    insecure: r.insecure,
    text: r.ok ? clipText(r.text, 80) : '',
    reasoning: r.ok ? r.reasoning : '',
    error: r.ok ? null : r.error,
    sentBody: built.body || null,
    notes: built.notes || [],
    hints: built.hints || []
  };
}

// 拉取该端点的模型列表（GET /models）。用于「从服务商拉模型名」而不是手打。
export async function listModels(model) {
  const m = normalizeModel(model);
  if (!m.baseUrl) return { ok: false, ids: [], error: '未填 Base URL' };
  const headers = { 'Content-Type': 'application/json' };
  if (m.apiKey) headers['Authorization'] = 'Bearer ' + m.apiKey;
  const extra = parseHeaderLines(m.extraHeaders);
  Object.keys(extra).forEach((k) => {
    headers[k] = extra[k];
  });
  let r;
  try {
    r = await getJson(modelsUrl(m.baseUrl), { headers: headers, timeoutMs: 20000 });
  } catch (e) {
    return { ok: false, ids: [], error: (e && e.message) || String(e) };
  }
  if (!r.ok) {
    const f = describeFailure(r);
    return { ok: false, ids: [], error: f.message + (f.detail ? '：' + f.detail : '') };
  }
  const j = r.json;
  const arr = j && Array.isArray(j.data) ? j.data : j && Array.isArray(j.models) ? j.models : [];
  const ids = [];
  arr.forEach((it) => {
    if (typeof it === 'string') ids.push(it);
    else if (it && typeof it.id === 'string') ids.push(it.id);
    else if (it && typeof it.name === 'string') ids.push(it.name);
  });
  ids.sort();
  return { ok: true, ids: ids, error: '' };
}
