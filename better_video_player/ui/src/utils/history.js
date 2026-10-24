// 播放历史：纯逻辑 + kvstore 持久化。
// schema v1: { version: 1, entries: [{ path, name, size, positionMs, durationMs, rate, volume, updatedAt }] }
import kvstore from './kvstore.js'

const KEY = 'bpv-history'
const SCHEMA_VERSION = 1
const MAX_ENTRIES = 50

// 新数据与已有历史合并：同一路径保留旧记录的「看过次数/首次时间」等，覆盖播放进度。
export function touch(list, entry, now) {
  const prev = list.find(it => it && it.path === entry.path)
  const merged = {
    version: SCHEMA_VERSION,
    path: entry.path,
    name: entry.name || (prev && prev.name) || '',
    size: Number(entry.size != null ? entry.size : (prev && prev.size) || 0),
    positionMs: Math.max(0, Math.round(Number(entry.positionMs || 0))),
    durationMs: Math.max(0, Math.round(Number(entry.durationMs != null ? entry.durationMs : (prev && prev.durationMs) || 0))),
    rate: Number(entry.rate || (prev && prev.rate) || 1),
    volume: entry.volume != null ? Math.min(100, Math.max(0, Math.round(Number(entry.volume)))) : (prev && prev.volume != null ? prev.volume : 70),
    updatedAt: Math.max(Number(now || 0), (prev && prev.updatedAt) || 0),
    playCount: ((prev && prev.playCount) || 0) + 1,
  }
  const rest = list.filter(it => it && it.path !== entry.path)
  return [merged].concat(rest).slice(0, MAX_ENTRIES)
}

// 仅更新进度（不打断播放时频繁写）：不存在则忽略。
export function updateProgress(list, path, positionMs, durationMs, now) {
  const idx = list.findIndex(it => it && it.path === path)
  if (idx === -1) return list
  const next = list.slice()
  const it = next[idx]
  next[idx] = Object.assign({}, it, {
    positionMs: Math.max(0, Math.round(Number(positionMs || 0))),
    durationMs: Math.max(0, Math.round(Number(durationMs != null ? durationMs : it.durationMs || 0))),
    updatedAt: Number(now || it.updatedAt || 0),
  })
  next[idx].updatedAt = Number(now || 0) || it.updatedAt
  return next
}

// 按 updatedAt 降序
export function sorted(list) {
  return list.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

// 清理：文件已不存在 / 非法条目剔除
export function prune(list, existsFn) {
  return list.filter(it => {
    if (!it || typeof it.path !== 'string' || it.path === '') return false
    if (typeof existsFn === 'function') return existsFn(it.path) !== false
    return true
  })
}

// 「继续播放」候选：最近一条且未播完（播完阈值：进度 >= 98%）
export function resumeCandidate(list) {
  const s = sorted(list)
  for (const it of s) {
    if (!it.durationMs || !it.positionMs) return it
    if (it.positionMs / it.durationMs < 0.98) return it
  }
  return null
}

export function normalizeLoaded(raw) {
  if (!raw || typeof raw !== 'object') return { version: SCHEMA_VERSION, entries: [] }
  let entries = Array.isArray(raw.entries) ? raw.entries : (Array.isArray(raw) ? raw : [])
  entries = entries.filter(it => it && typeof it.path === 'string' && it.path !== '')
  return { version: SCHEMA_VERSION, entries: entries.slice(0, MAX_ENTRIES) }
}

export async function load() {
  const raw = await kvstore.getItem(KEY, null)
  return normalizeLoaded(raw)
}

export async function save(state) {
  return kvstore.setItem(KEY, { version: SCHEMA_VERSION, entries: state.entries })
}

export async function record(entry, now) {
  const state = await load()
  state.entries = touch(state.entries, entry, now || Date.now())
  await save(state)
  return state
}

export async function saveProgress(path, positionMs, durationMs) {
  const state = await load()
  state.entries = updateProgress(state.entries, path, positionMs, durationMs, Date.now())
  return save(state)
}

export default { load, save, record, saveProgress, touch, updateProgress, sorted, prune, resumeCandidate, normalizeLoaded, KEY, MAX_ENTRIES }
