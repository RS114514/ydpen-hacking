// 持久化 KV 适配层。
// 真机契约（探针验证）：storage.setStorage({key, data}) / storage.getStorage({key}) -> {data}
// 值统一 JSON 序列化；同一 key 的写入排队串行，避免乱序覆盖。
const memory = {}

function storageApi() {
  try {
    const st = $falcon && $falcon.jsapi && $falcon.jsapi.storage
    if (st && typeof st.getStorage === 'function' && typeof st.setStorage === 'function') return st
  } catch (e) { /* jsapi 缺失 */ }
  return null
}

const writeChains = {}

function enqueueWrite(key, task) {
  const prev = writeChains[key] || Promise.resolve()
  const next = prev.then(task, task)
  writeChains[key] = next
  return next
}

function withTimeout(promise, ms) {
  return new Promise(resolve => {
    let done = false
    const t = setTimeout(() => { if (!done) { done = true; resolve(undefined) } }, ms)
    Promise.resolve(promise).then(
      v => { if (!done) { done = true; clearTimeout(t); resolve(v) } },
      () => { if (!done) { done = true; clearTimeout(t); resolve(undefined) } }
    )
  })
}

export async function getItem(key, fallback = null) {
  const st = storageApi()
  if (!st) return key in memory ? memory[key] : fallback
  try {
    const res = await withTimeout(st.getStorage({ key }), 1200)
    let data = res && typeof res === 'object' && 'data' in res ? res.data : res
    if (data === '' || data == null) return fallback
    if (typeof data === 'string') {
      try { return JSON.parse(data) } catch (e) { return data }
    }
    return data
  } catch (e) {
    return key in memory ? memory[key] : fallback
  }
}

export function setItem(key, value) {
  memory[key] = value
  const st = storageApi()
  const payload = JSON.stringify(value)
  if (!st) return Promise.resolve(false)
  return enqueueWrite(key, async () => {
    try {
      await withTimeout(st.setStorage({ key, data: payload }), 3000)
      return true
    } catch (e) {
      console.log('[kvstore] set failed ' + key + ' ' + e)
      return false
    }
  })
}

export default { getItem, setItem }
