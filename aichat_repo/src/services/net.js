// 传输层。真机契约来源：profiles/youdao-x5.md（youdao-x5-fw3.4.6）
// 与 native/csrc/httpjson.c（模块源码；本仓库 libs/libjsapi_httpjson.so 即其产物）。
//
// 主路径 —— native `httpjson` 模块（唯一能做「JSON POST + 自定义头 + 长超时 + 非 2xx 带 body」的通道）：
//   import httpjson from 'httpjson'
//   startPost(url, headersText, bodyText, timeoutMs) -> id   // 后台 pthread 发请求，不阻塞 QuickJS
//   takeResult(id)  -> JSON 字符串 | null                    // 完成才返回，读完即回收（读走即释放）
//   cancelAll()                                              // 取消在途 / 回收已完成任务
//   返回体：{"status":N,"curlCode":N,"insecure":0|1,"error":null|"…","body":"…"}
//   关键点 1：非 2xx **也带 body** → 服务商的错误 JSON（401/402/429…）拿得到，可显示真实原因。
//   关键点 2：body 原样字节发送（CURLOPT_POSTFIELDS + POSTFIELDSIZE），不经任何再序列化。
//   关键点 3：postSync / getBinary 是**同步**实现（curl_easy_perform 跑在 JS 线程上）→ 会冻住
//            UI 单线程，本应用**一律不使用**，只走 startPost + takeResult 轮询。
//
// 兜底 —— jsapi `$falcon.jsapi.http.request`：GET 可用；POST 不可用（见下），仅作最后退路。
//   （运行时会对 data 做二次 JSON 序列化，且非 2xx 拿不到响应体 → OpenAI 兼容 API 会 422。）
//
// 本应用**不做流式（SSE）**：takeResult 只在整包完成后返回，无法分块；
// 分块渲染需要改 C 源码重新编译，而本机无 zig 交叉编译器（profile 记录为 zig 0.16）。
// 因此请求一律 stream:false，UI 用「已耗时 + 思考中」补偿等待感。

import { logWarn } from './storage.js';

const POLL_MS = 120; // takeResult 轮询间隔
const MIN_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 300000;

let nativeMod = null;
let nativeProbed = false;
let nativeErr = '';
let warmed = false;

// ---- 探测与预热 ----
export async function initTransport() {
  if (nativeProbed) return nativeMod;
  nativeProbed = true;
  try {
    const m = await import('httpjson');
    const mod = m && typeof m.startPost === 'function' ? m : m && m.default;
    if (mod && typeof mod.startPost === 'function' && typeof mod.takeResult === 'function') {
      nativeMod = mod;
    } else {
      nativeErr = '模块已加载但缺少 startPost/takeResult';
    }
  } catch (e) {
    nativeErr = (e && e.message) || String(e);
  }
  if (!nativeMod) {
    logWarn('[net] native httpjson 不可用，回退 jsapi http：' + nativeErr);
  } else {
    warmUp();
  }
  return nativeMod;
}

// 预热：设备 libcurl 7.77.0 的 curl_global_init 是惰性且**非线程安全**的
// （httpjson.c 全篇没有 curl_global_init，首个请求由后台 pthread 触发）。
// 这里在启动阶段用一次「必然失败的本地请求」把这步初始化单线程做掉，
// 之后即便出现并发 easy_init 也不会踩到惰性初始化的竞态。
// 目标 127.0.0.1:1 无网络流量、秒级返回；结果直接丢弃，不影响任何 UI。
function warmUp() {
  if (warmed || !nativeMod) return;
  warmed = true;
  let id = 0;
  try {
    id = nativeMod.startPost('http://127.0.0.1:1/', '', '', 1500);
  } catch (e) {
    return;
  }
  if (!id) return;
  const t0 = Date.now();
  const timer = setInterval(() => {
    let raw = null;
    try {
      raw = nativeMod.takeResult(id);
    } catch (e) {
      raw = '{"status":0}';
    }
    if (raw !== null && raw !== undefined) {
      clearInterval(timer);
      return;
    }
    if (Date.now() - t0 > 6000) {
      clearInterval(timer);
      try {
        nativeMod.cancelAll();
      } catch (e) {
        /* 幂等 */
      }
    }
  }, 300);
}

export function nativeReady() {
  return !!nativeMod;
}

export function transportInfo() {
  if (nativeMod) {
    return { name: 'native', label: 'native httpjson', detail: '支持 JSON POST / 自定义头 / 错误体' };
  }
  const api = jsapiHttp();
  if (api) return { name: 'jsapi', label: 'jsapi http（兜底）', detail: nativeErr || '未探测到 native 模块' };
  return { name: 'none', label: '无网络通道', detail: nativeErr || 'jsapi.http 也不可用' };
}

function jsapiHttp() {
  const f = typeof $falcon !== 'undefined' ? $falcon : null;
  const jsapi = f && f.jsapi;
  if (!jsapi) return null;
  if (jsapi.http && typeof jsapi.http.request === 'function') return jsapi.http;
  if (jsapi.net && typeof jsapi.net.request === 'function') return jsapi.net;
  return null;
}

export function netAvailable() {
  return !!nativeMod || !!jsapiHttp();
}

// ---- 工具 ----
export function clampTimeout(ms) {
  const n = Number(ms);
  if (!isFinite(n) || n <= 0) return 90000;
  return Math.min(Math.max(Math.round(n), MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

// 请求头 → 单条 CRLF 文本（native 契约：一个字符串，逐行 "Key: Value"；
// C 侧按 '\n' 切分并去掉行尾 '\r' 与空格）。
// 注意：curl 会给 >1024 字节的 POST 体自动加 `Expect: 100-continue`，
// 部分服务端会因此多一个往返甚至直接挂住 → 这里固定注入一行无值 `Expect:`，
// 它经 C 侧 trim 后变成 "Expect:"，libcurl 语义即「移除该头」。
export function headersToLines(headers) {
  const lines = ['Expect: '];
  if (headers) {
    Object.keys(headers).forEach((k) => {
      const v = headers[k];
      if (typeof v === 'string' && v) lines.push(k + ': ' + v);
    });
  }
  return lines.join('\r\n');
}

// 请求头 → 运行时对象形态（jsapi 契约：header 单数，值为字符串）
export function headersToObject(headers) {
  const out = {};
  let n = 0;
  if (!headers) return null;
  Object.keys(headers).forEach((k) => {
    const v = headers[k];
    if (typeof v === 'string' && v) {
      out[k] = v;
      n++;
    }
  });
  return n > 0 ? out : null;
}

export function normalizeError(e) {
  if (e instanceof Error) return e;
  let msg = '';
  if (e && typeof e === 'object') msg = e.message || e.msg || e.error || '';
  else if (typeof e === 'string') msg = e;
  const err = new Error(msg || 'NET_UNKNOWN: 未知网络错误');
  if (e && typeof e === 'object') err.raw = e;
  return err;
}

export function tryParseJson(text) {
  if (text && typeof text === 'object') return text;
  if (typeof text !== 'string') return null;
  const t = text.replace(/^\uFEFF/, '').trim();
  if (!t) return null;
  if (t.charAt(0) !== '{' && t.charAt(0) !== '[') return null;
  try {
    return JSON.parse(t);
  } catch (e) {
    return null;
  }
}

// curl 退出码 → 人话（只在拿不到 HTTP 状态码时才有意义）
export function curlCodeText(code) {
  const map = {
    1: '不支持的协议',
    3: 'URL 格式错误',
    5: '无法解析代理',
    6: '域名解析失败（检查 WiFi / 地址拼写）',
    7: '连接失败（网络不通或端口被拦）',
    28: '超时（网络慢或服务端长时间不响应）',
    35: 'TLS 握手失败',
    51: '证书校验失败',
    52: '服务端无响应',
    55: '发送数据失败',
    56: '接收数据失败'
  };
  const key = Math.trunc(Number(code) || 0);
  return map[key] || ('网络错误(curl ' + key + ')');
}

// HTTP 状态码 → 人话（AI 服务商常见语义）
export function statusText(status) {
  const map = {
    400: '请求被拒绝（参数或模型名不对）',
    401: '认证失败（API Key 无效或未填）',
    402: '余额不足或需要付费',
    403: '无权限（Key 受限或地区不支持）',
    404: '地址或模型不存在（检查 Base URL / 模型名）',
    408: '服务端超时',
    413: '请求体过大（上下文太长）',
    422: '参数不被接受（可能不支持某个字段）',
    429: '请求过于频繁或被限流',
    500: '服务端内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '网关超时'
  };
  return map[status] || ('HTTP ' + status);
}

// ---- native 主路径 ----
function nativePost(url, headers, bodyText, timeoutMs) {
  return new Promise((resolve, reject) => {
    const mod = nativeMod;
    let id = 0;
    try {
      id = mod.startPost(url, headersToLines(headers), bodyText, timeoutMs);
    } catch (e) {
      reject(normalizeError(e));
      return;
    }
    if (!id) {
      // C 侧注释写「0 表示失败」，实际实现是抛异常；两者都兜住。
      reject(new Error('NET_START_FAIL: startPost 未返回任务 id'));
      return;
    }
    const t0 = Date.now();
    let timer = 0;
    let settled = false;
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = 0;
      }
    };
    const fail = (err) => {
      if (settled) return;
      settled = true;
      stop();
      reject(err);
    };
    const tick = () => {
      let raw = null;
      try {
        raw = mod.takeResult(id);
      } catch (e) {
        fail(normalizeError(e));
        return;
      }
      if (raw === null || raw === undefined) {
        if (Date.now() - t0 > timeoutMs + 5000) {
          try {
            mod.cancelAll();
          } catch (e) {
            /* 幂等 */
          }
          fail(new Error('NET_TIMEOUT: 等待超时（' + Math.round(timeoutMs / 1000) + 's）'));
        }
        return;
      }
      let parsed = null;
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        fail(new Error('NET_BAD_RESULT: native 结果不是合法 JSON'));
        return;
      }
      settled = true;
      stop();
      resolve({
        transport: 'native',
        status: Number(parsed && parsed.status) || 0,
        body: parsed && typeof parsed.body === 'string' ? parsed.body : '',
        error: parsed && parsed.error ? String(parsed.error) : '',
        curlCode: Number(parsed && parsed.curlCode) || 0,
        insecure: !!(parsed && parsed.insecure),
        ms: Date.now() - t0
      });
    };
    timer = setInterval(tick, POLL_MS);
    tick(); // 立刻探一次：快速失败不必等一个轮询周期
  });
}

// ---- jsapi 兜底路径 ----
function jsapiRequest(options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const api = jsapiHttp();
    if (!api) {
      reject(new Error('NET_UNAVAILABLE: jsapi.http 不可用'));
      return;
    }
    let settled = false;
    let guard = 0;
    const done = (isErr, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      if (isErr) reject(arg);
      else resolve(arg);
    };
    try {
      const ret = api.request(options, (res, err) => {
        if (err) done(true, normalizeError(err));
        else done(false, res);
      });
      if (ret && typeof ret.then === 'function') {
        ret.then(
          (res) => done(false, res),
          (e) => done(true, normalizeError(e))
        );
      }
    } catch (e) {
      done(true, normalizeError(e));
      return;
    }
    guard = setTimeout(() => done(true, new Error('NET_TIMEOUT: 请求超时(' + timeoutMs + 'ms)')), timeoutMs + 500);
  });
}

function unwrapJsapi(res) {
  if (res == null || typeof res !== 'object') return { status: 0, body: '', error: '' };
  const hasError = res.error !== undefined && res.error !== 0 && res.error !== null;
  if (hasError) {
    const info = res.result !== undefined ? res.result : res.error;
    let msg = '';
    let status = 0;
    if (info && typeof info === 'object') {
      msg = info.errorMessage || info.message || '';
      if (typeof info.statusCode === 'number') status = info.statusCode;
    } else if (typeof info === 'string') {
      msg = info;
    }
    const m = typeof msg === 'string' ? msg.match(/resCode:(\d+)/) : null;
    if (m) status = parseInt(m[1], 10);
    const body = info && typeof info.data === 'string' ? info.data : '';
    return { status: status, body: body, error: msg || '运行时网络错误' };
  }
  let body = '';
  if (typeof res.result === 'string') body = res.result;
  else if (typeof res.data === 'string') body = res.data;
  else if (typeof res.body === 'string') body = res.body;
  else if (typeof res.text === 'string') body = res.text;
  else if (res.result !== undefined) {
    try {
      body = JSON.stringify(res.result);
    } catch (e) {
      body = '';
    }
  }
  const status = typeof res.statusCode === 'number' ? res.statusCode : typeof res.status === 'number' ? res.status : 200;
  return { status: status, body: body, error: '' };
}

async function jsapiPost(url, headers, payload, timeoutMs) {
  const t0 = Date.now();
  const options = { url: url, method: 'POST', timeout: timeoutMs };
  // 兜底路径只传对象（传字符串会被运行时再包一层引号 → 服务端收到的是 JSON 字符串而不是对象）
  options.data = payload;
  const h = headersToObject(headers);
  if (h) options.header = h;
  const res = await jsapiRequest(options, timeoutMs);
  const u = unwrapJsapi(res);
  return {
    transport: 'jsapi',
    status: u.status,
    body: u.body,
    error: u.error,
    curlCode: 0,
    insecure: false,
    ms: Date.now() - t0
  };
}

// ---- 公开 API ----
// 统一 POST JSON。
// 返回 { transport, status, body, json, error, curlCode, insecure, ms, ok }
export async function postJson(url, payload, opts) {
  const o = opts || {};
  const timeoutMs = clampTimeout(o.timeoutMs);
  const bodyText = typeof payload === 'string' ? payload : JSON.stringify(payload);
  await initTransport();
  let r;
  if (nativeMod) {
    r = await nativePost(url, o.headers, bodyText, timeoutMs);
  } else {
    r = await jsapiPost(url, o.headers, payload, timeoutMs);
  }
  r.json = tryParseJson(r.body);
  r.ok = !r.error && r.status >= 200 && r.status < 300;
  return r;
}

// GET 文本（jsapi http 的 GET 已被真机证明可靠，且不需要自定义 body）。
export async function getJson(url, opts) {
  const o = opts || {};
  const timeoutMs = clampTimeout(o.timeoutMs || 20000);
  await initTransport();
  const t0 = Date.now();
  const options = { url: url, method: 'GET', timeout: timeoutMs };
  const h = headersToObject(o.headers);
  if (h) options.header = h;
  const res = await jsapiRequest(options, timeoutMs);
  const u = unwrapJsapi(res);
  return {
    transport: 'jsapi',
    status: u.status,
    body: u.body,
    json: tryParseJson(u.body),
    error: u.error,
    ok: !u.error && u.status >= 200 && u.status < 300,
    ms: Date.now() - t0
  };
}

// 取消在途请求（用户点「停止」/ 页面卸载）。
// 注意：cancelAll **不会**中断已经发出的 curl 传输——它只是把任务标记取消，
// 由工作线程在 curl 返回后自行回收，所以「停止」的语义是「不再等待并丢弃结果」，
// 真正的连接释放上界等于该次请求的 timeoutMs。
export async function cancelAll() {
  const mod = nativeMod;
  if (mod && typeof mod.cancelAll === 'function') {
    try {
      mod.cancelAll();
    } catch (e) {
      /* 幂等忽略 */
    }
  }
}
