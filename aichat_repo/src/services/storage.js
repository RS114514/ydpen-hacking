// 存储 adapter（真机证据 youdao-x5-fw3.4.6）——
//   getStorage({key}) → Promise<{data:string}>；setStorage({key, data}) 才落盘
//   （传 value/content 会落盘为空串；字符串形态 setStorage(k,v) 的 promise 永不 settle）
// 因此统一走对象形态 + 超时保护；失败时保留内存态，保证 UI 不因存储异常而卡死。
// 高频写入串行化（writeChain），避免读改写竞态把旧值写回去。

const MEMORY = {};

export const KEYS = {
  // 模型/服务商配置 + 生成参数（schema 见 services/config.js）
  config: 'apc_config',
  // 对话记录（schema 见 services/chat.js）
  history: 'apc_history',
  // 最后一次扫描结果（文字/译文/语种；schema 见 services/scan.js）
  lastScan: 'apc_lastscan',
  // 面板页上次停留的区块（services/ui.js）
  panelView: 'apc_panelview'
};

function getSetPair() {
  const f = typeof $falcon !== 'undefined' ? $falcon : null;
  const s = f && f.jsapi && f.jsapi.storage;
  if (!s) return null;
  if (typeof s.getStorage === 'function' && typeof s.setStorage === 'function') {
    return {
      get: (key) => s.getStorage({ key: key }),
      set: (key, v) => s.setStorage({ key: key, data: v })
    };
  }
  return null;
}

export function storageAvailable() {
  return !!getSetPair();
}

export function logWarn(msg) {
  // 设备日志只落 console.warn/error（console.log 不落盘）
  try {
    console.warn(msg);
  } catch (e) {
    /* 忽略 */
  }
}

export function normalizeStoredValue(result) {
  if (result == null) return '';
  if (typeof result === 'object') {
    if (typeof result.data === 'string') return result.data;
    if (typeof result.value === 'string') return result.value;
    return '';
  }
  return typeof result === 'string' ? result : '';
}

function withTimeout(p, ms) {
  let timer = 0;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ __timeout: true }), ms);
  });
  return Promise.race([p, timeout]).then((r) => {
    clearTimeout(timer);
    return r;
  });
}

async function rawGet(key) {
  const pair = getSetPair();
  if (!pair) {
    return { ok: true, raw: typeof MEMORY[key] === 'string' ? MEMORY[key] : '' };
  }
  // ok=false 表示「这次读**失败/超时**了」，与「设备里确实没存过」是两回事。
  // 调用方必须区分：把读失败当成空值会让上层用默认值覆盖掉真实数据
  // （典型后果：API Key 被清空 → 之后所有请求 401）。
  try {
    const r = await withTimeout(pair.get(key), 5000);
    if (r && r.__timeout) {
      logWarn('[storage] get 超时: ' + key);
      return { ok: false, raw: typeof MEMORY[key] === 'string' ? MEMORY[key] : '' };
    }
    const v = normalizeStoredValue(r);
    if (v) {
      // 读到的值必须同步进内存缓存，否则后续读取会拿到空值并反过来覆盖存储
      MEMORY[key] = v;
      return { ok: true, raw: v };
    }
    return { ok: true, raw: typeof MEMORY[key] === 'string' ? MEMORY[key] : '' };
  } catch (e) {
    logWarn('[storage] get 异常: ' + key + ' ' + (e && e.message));
    return { ok: false, raw: typeof MEMORY[key] === 'string' ? MEMORY[key] : '' };
  }
}

let writeChain = Promise.resolve();

function rawSet(key, value) {
  const run = async () => {
    MEMORY[key] = value;
    const pair = getSetPair();
    if (!pair) return;
    try {
      await withTimeout(pair.set(key, value), 3000);
      const back = await withTimeout(pair.get(key), 3000);
      if (!(back && !back.__timeout && normalizeStoredValue(back) === value)) {
        logWarn('[storage] 写入未持久化: ' + key);
      }
    } catch (e) {
      logWarn('[storage] set 异常: ' + (e && e.message));
    }
  };
  writeChain = writeChain.then(run, run);
  return writeChain;
}

export async function getJson(key, fallback) {
  const r = await rawGet(key);
  if (!r.raw) return fallback;
  try {
    return JSON.parse(r.raw);
  } catch (e) {
    logWarn('[storage] JSON 损坏: ' + key);
    return fallback;
  }
}

// 带「读成功与否」的版本。需要区分「没存过」与「读失败」时用它：
// 只有在 ok=true 且值为空时，才允许用默认值回写（否则会覆盖真实数据）。
export async function getJsonChecked(key, fallback) {
  const r = await rawGet(key);
  if (!r.ok) return { ok: false, value: fallback };
  if (!r.raw) return { ok: true, value: fallback, empty: true };
  try {
    return { ok: true, value: JSON.parse(r.raw) };
  } catch (e) {
    logWarn('[storage] JSON 损坏: ' + key);
    return { ok: true, value: fallback, corrupt: true };
  }
}

export function setJson(key, obj) {
  return rawSet(key, JSON.stringify(obj));
}

export async function getString(key, fallback) {
  const raw = await rawGet(key);
  return raw || fallback;
}

export function setString(key, value) {
  return rawSet(key, String(value == null ? '' : value));
}

export function memoryPeek(key) {
  return typeof MEMORY[key] === 'string' ? MEMORY[key] : '';
}

export function removeKey(key) {
  MEMORY[key] = '';
  return rawSet(key, '');
}
