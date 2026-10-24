// 配置读写：storage 里的 JSON ←→ 归一化后的 config 对象。
// 单独一层是为了让页面只关心「拿到一份一定合法的配置」。

import { KEYS, getJsonChecked, setJson, removeKey } from './storage.js';
import { normalizeConfig, normalizeParams, defaultConfig } from './config.js';

// 返回 { cfg, ok }：ok=false 表示存储读失败（此时给的是内存兜底/默认值，
// **调用方不应据此回写**，否则会用默认值覆盖掉用户真实的模型与 API Key）。
export async function loadConfigChecked() {
  const r = await getJsonChecked(KEYS.config, null);
  const cfg = normalizeConfig(r.value);
  if (r.ok && r.empty) {
    // 只有「确实读到空」才落盘默认配置（首次运行）
    setJson(KEYS.config, cfg);
  }
  return { cfg: cfg, ok: r.ok };
}

export async function loadConfig() {
  const r = await loadConfigChecked();
  return r.cfg;
}

export function saveConfig(cfg) {
  return setJson(KEYS.config, normalizeConfig(cfg));
}

// 只重置生成参数，保留模型列表与 API Key（「恢复默认参数」按钮用这个）
export function resetParams(cfg) {
  const next = Object.assign({}, cfg, { params: normalizeParams(null) });
  setJson(KEYS.config, normalizeConfig(next));
  return normalizeConfig(next);
}

// 真正的出厂重置：模型与 Key 一起清掉（当前只有「无配置」路径会用到）
export function resetConfig() {
  const cfg = defaultConfig();
  setJson(KEYS.config, cfg);
  return cfg;
}

export function wipeConfig() {
  return removeKey(KEYS.config);
}
