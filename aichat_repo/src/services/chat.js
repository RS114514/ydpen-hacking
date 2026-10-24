// 对话记录：schema 归一 + 落盘（走 storage.js 的设备存储适配）。
// 记录条数上限刻意保守：笔端内存 ~350MB 且单核，长会话既拖慢渲染也拖慢请求。

import { KEYS, getJsonChecked, setJson, logWarn } from './storage.js';
import { uid } from './util.js';

export const HISTORY_SCHEMA_VERSION = 1;
export const MAX_MESSAGES = 60; // 落盘上限（超出丢最旧的）

export function newMessage(role, text, extra) {
  const m = {
    id: uid('msg'),
    role: role === 'assistant' ? 'assistant' : role === 'system' ? 'system' : 'user',
    text: typeof text === 'string' ? text : '',
    reasoning: '',
    ts: Date.now(),
    ms: 0,
    model: '',
    usage: null,
    error: '',
    truncated: false,
    cancelled: false
  };
  if (extra && typeof extra === 'object') {
    Object.keys(extra).forEach((k) => {
      m[k] = extra[k];
    });
  }
  return m;
}

export function normalizeMessage(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const role = r.role === 'assistant' ? 'assistant' : r.role === 'system' ? 'system' : 'user';
  const usage = r.usage && typeof r.usage === 'object'
    ? {
        prompt: Number(r.usage.prompt) || 0,
        completion: Number(r.usage.completion) || 0,
        total: Number(r.usage.total) || 0
      }
    : null;
  return {
    id: typeof r.id === 'string' && r.id ? r.id : uid('msg'),
    role: role,
    text: typeof r.text === 'string' ? r.text : '',
    reasoning: typeof r.reasoning === 'string' ? r.reasoning : '',
    ts: Number(r.ts) || Date.now(),
    ms: Number(r.ms) || 0,
    model: typeof r.model === 'string' ? r.model : '',
    usage: usage,
    error: typeof r.error === 'string' ? r.error : '',
    truncated: r.truncated === true,
    cancelled: r.cancelled === true
  };
}

export function normalizeHistory(raw) {
  const empty = { version: HISTORY_SCHEMA_VERSION, messages: [], updatedAt: 0 };
  if (!raw || typeof raw !== 'object') return empty;
  const list = Array.isArray(raw.messages) ? raw.messages : [];
  const messages = list
    .map(normalizeMessage)
    .filter((m) => m.text || m.reasoning || m.error)
    .slice(-MAX_MESSAGES);
  return {
    version: HISTORY_SCHEMA_VERSION,
    messages: messages,
    updatedAt: Number(raw.updatedAt) || 0
  };
}

// 返回 { history, ok }：ok=false 表示存储读失败。
// 关键：读失败时**不能**让调用方把空历史当成真实状态，否则下一次保存会把
// 用户之前的对话整段覆盖掉。
export async function loadHistoryChecked() {
  const r = await getJsonChecked(KEYS.history, null);
  return { history: normalizeHistory(r.value), ok: r.ok };
}

export async function loadHistory() {
  const r = await loadHistoryChecked();
  return r.history;
}

export function saveHistory(messages) {
  const capped = (Array.isArray(messages) ? messages : []).slice(-MAX_MESSAGES);
  return setJson(KEYS.history, {
    version: HISTORY_SCHEMA_VERSION,
    messages: capped,
    updatedAt: Date.now()
  });
}

export function clearHistory() {
  return setJson(KEYS.history, { version: HISTORY_SCHEMA_VERSION, messages: [], updatedAt: Date.now() });
}

// 追加并就地裁剪（返回新数组，避免 Vue 追踪不到变更）
export function appendMessage(messages, msg) {
  const next = (Array.isArray(messages) ? messages : []).concat([msg]);
  if (next.length > MAX_MESSAGES) next.splice(0, next.length - MAX_MESSAGES);
  return next;
}

export function replaceMessage(messages, id, patch) {
  const next = (Array.isArray(messages) ? messages : []).slice();
  for (let i = 0; i < next.length; i++) {
    if (next[i].id === id) {
      next[i] = normalizeMessage(Object.assign({}, next[i], patch));
      break;
    }
  }
  return next;
}

export function removeMessage(messages, id) {
  return (Array.isArray(messages) ? messages : []).filter((m) => m.id !== id);
}

export function dropLastAssistant(messages) {
  const next = (Array.isArray(messages) ? messages : []).slice();
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].role === 'assistant') {
      next.splice(i, 1);
      break;
    }
  }
  return next;
}

// 会话摘要（左栏/标题用）
export function historySummary(messages) {
  const list = Array.isArray(messages) ? messages : [];
  let user = 0;
  let assistant = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].role === 'user') user++;
    else if (list[i].role === 'assistant') assistant++;
  }
  if (user === 0 && assistant === 0) return '还没有对话';
  return user + ' 问 · ' + assistant + ' 答';
}

export function lastError(messages) {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].error) return list[i].error;
  }
  return '';
}

export function logHistoryWarn(msg) {
  logWarn('[chat] ' + msg);
}
