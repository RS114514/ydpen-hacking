// common.js —— 样式取用、时间格式化、player 原生模块获取（构建后为 Common.js.bin）
import ST from './Styles.js';
import playerImported from 'player';

// 样式：S('类名') 取 CSS 里转换好的对象，可叠加覆盖
export function S(name, extra) {
  var base = ST[name] || {};
  var out = {};
  var k;
  for (k in base) out[k] = base[k];
  if (extra) for (k in extra) out[k] = extra[k];
  return out;
}

// 01:23 / 1:02:03
export function fmtTime(ms) {
  var s = Math.floor((Number(ms) || 0) / 1000);
  if (s < 0) s = 0;
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var ss = s % 60;
  var mm = m < 10 ? '0' + m : '' + m;
  var sx = ss < 10 ? '0' + ss : '' + ss;
  return h > 0 ? (h + ':' + mm + ':' + sx) : (mm + ':' + sx);
}

// player 模块：优先 import，其次 importModule('player')，最后 globalThis.player
export function getPlayer() {
  if (playerImported && typeof playerImported.open === 'function') return playerImported;
  try {
    if (typeof importModule === 'function') {
      var m = importModule('player');
      if (m && typeof m.open === 'function') return m;
    }
  } catch (e) { /* 忽略 */ }
  try {
    if (globalThis.player && typeof globalThis.player.open === 'function') return globalThis.player;
  } catch (e) { /* 忽略 */ }
  return null;
}

// 原生返回对象或 JSON 字符串，统一成对象
export function parseNative(v) {
  if (v && typeof v === 'object') return v;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  return null;
}

export function log(m) {
  try { console.warn('[vp] ' + m); } catch (e) { /* 忽略 */ }
}
