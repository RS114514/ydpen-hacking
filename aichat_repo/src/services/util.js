// 零依赖小工具（纯函数，便于在 Node 下单测）

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

// 时间戳 → HH:MM
export function fmtTime(ts) {
  const d = new Date(Number(ts) || Date.now());
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

// 毫秒 → 人读时长
export function fmtDuration(ms) {
  const n = Number(ms) || 0;
  if (n < 1000) return n + 'ms';
  if (n < 60000) return (n / 1000).toFixed(1) + 's';
  const m = Math.floor(n / 60000);
  const s = Math.round((n % 60000) / 1000);
  return m + '分' + s + '秒';
}

export function clipText(s, n) {
  const t = String(s == null ? '' : s);
  if (t.length <= n) return t;
  return t.slice(0, Math.max(0, n - 1)) + '…';
}

// API Key 脱敏（日志/界面用）：只露前 3 后 4
export function maskKey(k) {
  const s = String(k || '');
  if (!s) return '（未填写）';
  if (s.length <= 9) return s.slice(0, 2) + '···';
  return s.slice(0, 3) + '···' + s.slice(-4);
}

export function uid(prefix) {
  return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36);
}

// 归一化 Base URL：去尾部斜杠；缺 /v1 之类的版本段不自动补（各服务商不一致，交给用户）
export function normalizeBaseUrl(u) {
  let s = String(u || '').trim();
  if (!s) return '';
  s = s.replace(/\s+/g, '');
  s = s.replace(/\/+$/, '');
  return s;
}

// 补全为 chat/completions 完整地址：
//   https://api.deepseek.com/v1            → https://api.deepseek.com/v1/chat/completions
//   https://x/v1/chat/completions          → 原样
//   https://x/v1/                           → .../v1/chat/completions
export function chatCompletionsUrl(baseUrl) {
  const b = normalizeBaseUrl(baseUrl);
  if (!b) return '';
  if (/\/chat\/completions$/.test(b)) return b;
  return b + '/chat/completions';
}

export function modelsUrl(baseUrl) {
  const b = normalizeBaseUrl(baseUrl);
  if (!b) return '';
  if (/\/chat\/completions$/.test(b)) return b.replace(/\/chat\/completions$/, '/models');
  return b + '/models';
}

// 解析「每行 Key: Value」形式的额外请求头
export function parseHeaderLines(text) {
  const out = {};
  if (!text) return out;
  String(text).split(/\r?\n/).forEach((line) => {
    const s = line.trim();
    if (!s || s.charAt(0) === '#') return;
    const i = s.indexOf(':');
    if (i <= 0) return;
    const k = s.slice(0, i).trim();
    const v = s.slice(i + 1).trim();
    if (k) out[k] = v;
  });
  return out;
}

export function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return fallback;
  }
}

// 把 -0 / NaN / 越界统一收敛，避免脏值进请求体
export function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
