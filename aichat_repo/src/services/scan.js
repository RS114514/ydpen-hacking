// 扫描（OCR）接入。真机实测结论（youdao-x5-fw3.4.6，证据见 docs/reverse-scan-ocr.md §7）：
//
//   · 模块名是 `lookup_word`（**不是** `lookup`），导出只有一个键：构造函数 LookupWord
//   · 方法/信号都在**实例**上：const lw = new LookupWord()
//   · 扫描过程会持续推这些信号（实测一次英文扫描的完整序列）：
//       ocrStartChanged(true)
//       ocrResultChanged("offer") → ("offer someon") → ("offer someone a helping hand")  ← 逐字增长
//       ocrStopChanged("offer someone a helping hand", 1)
//       breakListChanged({"breakList":[...],"breakListMergeWord":"...","src":"en","dst":"zh",...})
//       currentQueryChanged("offer someone a helping hand")
//       scanWordResultChanged(301, "向别人伸出援助之手")     ← 官方译文
//   · 需要把 libjsapi_lookup.so + libbusiness_lookup.so 打进工程 libs/（缺一不可）
//
// 两个必须遵守的约束（都踩过）：
//   1) **只能用动态 import + try/catch**。静态 `import ... from 'lookup_word'` 在模块
//      加载失败时会让整页 JS 求值失败 → 静默黑屏（日志只有 framework/js_modules/xxx open failed）。
//   2) 第三方应用拿不到 fs / history，所以「上一次扫描」必须**自己持久化**。

import { KEYS, getJson, setJson, logWarn } from './storage.js';

const MODULE_NAME = 'lookup_word';
const MAX_TEXT = 500;

let lw = null; // LookupWord 实例
let ready = false;
let initError = '';
let inited = false;

// 正在进行的扫描（实时增长）
let live = null;
// 最后一次**完成**的扫描（会持久化）
let last = null;

const listeners = [];

function emit() {
  const snap = snapshot();
  for (let i = 0; i < listeners.length; i++) {
    try {
      listeners[i](snap);
    } catch (e) {
      /* 单个监听器出错不影响其它 */
    }
  }
}

export function snapshot() {
  return {
    ready: ready,
    initError: initError,
    scanning: !!live,
    liveText: live ? live.text : '',
    text: last ? last.text : '',
    translation: last ? last.translation : '',
    src: last ? last.src : '',
    dst: last ? last.dst : '',
    ts: last ? last.ts : 0
  };
}

// 页面订阅变化（返回退订函数）
export function onScanChange(cb) {
  listeners.push(cb);
  return function () {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function getLastScan() {
  return last;
}

// 从存储里恢复上一次扫描（应用冷启动时用）
export async function loadStoredScan() {
  try {
    const v = await getJson(KEYS.lastScan, null);
    if (v && typeof v === 'object' && typeof v.text === 'string' && v.text) {
      last = {
        text: v.text,
        translation: typeof v.translation === 'string' ? v.translation : '',
        src: typeof v.src === 'string' ? v.src : '',
        dst: typeof v.dst === 'string' ? v.dst : '',
        ts: Number(v.ts) || 0
      };
      emit();
    }
  } catch (e) {
    logWarn('[scan] 读取上次扫描失败: ' + (e && e.message));
  }
  return last;
}

function persist() {
  if (!last) return;
  try {
    setJson(KEYS.lastScan, last);
  } catch (e) {
    logWarn('[scan] 写入上次扫描失败: ' + (e && e.message));
  }
}

function clip(s) {
  const t = String(s == null ? '' : s);
  return t.length > MAX_TEXT ? t.slice(0, MAX_TEXT) : t;
}

// 把一次扫描定稿并落盘
function finalize(text, extra) {
  const t = clip(text || (live ? live.text : '') || (last ? last.text : ''));
  if (!t) return;
  last = {
    text: t,
    translation: (extra && extra.translation) || (last && last.text === t ? last.translation : '') || '',
    src: (extra && extra.src) || (live && live.src) || (last && last.src) || '',
    dst: (extra && extra.dst) || (live && live.dst) || (last && last.dst) || '',
    ts: Date.now()
  };
  live = null;
  persist();
  emit();
  logWarn('[scan] 已记录扫描 textLen=' + t.length + ' src=' + last.src + ' dst=' + last.dst);
}

// 从 breakListChanged 的 JSON 里取语种与合并词
function absorbBreakList(payload) {
  let obj = payload;
  if (typeof payload === 'string') {
    try {
      obj = JSON.parse(payload);
    } catch (e) {
      return;
    }
  }
  if (!obj || typeof obj !== 'object') return;
  if (!live) live = { text: '', src: '', dst: '' };
  if (typeof obj.src === 'string') live.src = obj.src;
  if (typeof obj.dst === 'string') live.dst = obj.dst;
  if (!live.text && typeof obj.breakListMergeWord === 'string') live.text = clip(obj.breakListMergeWord);
  emit();
}

function bind(name, fn) {
  try {
    const sig = lw[name];
    if (sig && typeof sig.on === 'function') {
      sig.on(fn);
      return true;
    }
  } catch (e) {
    /* 忽略单个信号 */
  }
  return false;
}

// 初始化（可重复调用，只会真正初始化一次）
export async function initScan() {
  if (inited) return snapshot();
  inited = true;

  let mod = null;
  try {
    // 动态 import：静态 import 在模块不可用时会让整页黑屏
    mod = await import(MODULE_NAME);
  } catch (e) {
    initError = '模块不可用: ' + ((e && e.message) || e);
    logWarn('[scan] import ' + MODULE_NAME + ' 失败（不影响其它功能）: ' + initError);
    inited = false; // 允许以后重试（比如刷新按钮）
    return snapshot();
  }

  const Ctor = mod && (mod.LookupWord || (mod.default && mod.default.LookupWord));
  if (typeof Ctor !== 'function') {
    initError = '导出里没有 LookupWord 构造函数';
    logWarn('[scan] ' + initError);
    inited = false;
    return snapshot();
  }

  try {
    lw = new Ctor();
  } catch (e) {
    initError = 'new LookupWord 失败: ' + ((e && e.message) || e);
    logWarn('[scan] ' + initError);
    lw = null;
    inited = false;
    return snapshot();
  }

  // ---- 绑定信号 ----
  let n = 0;
  // 扫描开始
  if (bind('ocrStartChanged', function (v) {
    if (v) {
      live = { text: '', src: '', dst: '' };
      emit();
    }
  })) n++;

  // 实时识别文本（会连续触发，逐字增长）
  if (bind('ocrResultChanged', function (t) {
    const s = clip(t);
    if (!s) return;
    if (!live) live = { text: '', src: '', dst: '' };
    live.text = s;
    emit();
  })) n++;

  // 扫描结束：第一个参数是最终文本
  if (bind('ocrStopChanged', function (t) {
    const s = clip(t);
    if (s) finalize(s, null);
  })) n++;

  // 分词/语种
  if (bind('breakListChanged', absorbBreakList)) n++;

  // 最终查询串
  if (bind('currentQueryChanged', function (t) {
    const s = clip(t);
    if (s) {
      if (!live) live = { text: '', src: '', dst: '' };
      live.text = s;
      emit();
    }
  })) n++;

  // 官方译文（实测参数是 (dictType, 译文)）
  if (bind('scanWordResultChanged', function (a0, a1) {
    const tr = typeof a1 === 'string' ? a1 : typeof a0 === 'string' ? a0 : '';
    const text = (live && live.text) || (last && last.text) || '';
    if (text) finalize(text, { translation: tr });
    else if (tr) {
      // 极端情况：没拿到原文只拿到译文，也记一下
      last = { text: '', translation: tr, src: '', dst: '', ts: Date.now() };
      emit();
    }
  })) n++;

  // 句子翻译（长句走这条）
  if (bind('scanTranslatorResultChanged', function (a0, a1) {
    const tr = typeof a1 === 'string' ? a1 : typeof a0 === 'string' ? a0 : '';
    const text = (live && live.text) || (last && last.text) || '';
    if (text && tr) finalize(text, { translation: tr });
  })) n++;

  ready = true;
  initError = '';
  logWarn('[scan] 已就绪，绑定信号 ' + n + ' 个');
  emit();
  return snapshot();
}

// 供「刷新」按钮调用：重新 read 存储 + 确保信号已绑
export async function refreshScan() {
  await loadStoredScan();
  if (!ready) await initScan();
  emit();
  return snapshot();
}
