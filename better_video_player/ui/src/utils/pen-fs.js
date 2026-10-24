// 设备文件系统适配层（跨机型），面向视频扫描与历史持久化。
// 优先级：
//   1) 原生模块 custom（libjsapi_langningchen.so，armv7-glibc 笔预置）：custom.scan.*
//   2) 原生模块 fs（libjsapi_better_video.so，各 ABI 由 tools 编译）：readdir/stat/... Promise 风格
//   3) jsapi.scan（部分固件内置）
// 模块缺失时动态 import 的异常被捕获，不影响应用启动。
import custom from 'custom'

let fsModuleState = undefined // undefined=未探测, false=不可用, 否则为模块对象

async function fsApi() {
  if (fsModuleState !== undefined) return fsModuleState || null
  try {
    const m = await import('fs')
    const mod = m && (m.default || m)
    if (mod && typeof mod.readdir === 'function') {
      fsModuleState = mod
      return mod
    }
  } catch (e) { /* 模块不存在 */ }
  fsModuleState = false
  return null
}

function scanApi() {
  try {
    if (custom && custom.scan) return custom.scan
  } catch (e) { /* 模块缺失 */ }
  try {
    const jsapi = $falcon && $falcon.jsapi
    if (jsapi && jsapi.scan) return jsapi.scan
  } catch (e) { /* 无 scan jsapi */ }
  return null
}

function unwrap(result) {
  if (result && typeof result === 'object' && 'result' in result) return result.result
  return result
}

function normalizeEntry(item) {
  if (!item || item.name == null) return null
  let isDir = false
  if (typeof item.isDirectory === 'function') isDir = !!item.isDirectory()
  else if (item._isDirectory === true) isDir = true
  else isDir = !!item.isDir
  return { name: String(item.name), isDir }
}

export async function listDir(path) {
  const scan = scanApi()
  if (scan && typeof scan.listDir === 'function') {
    const raw = unwrap(await scan.listDir(String(path)))
    if (Array.isArray(raw)) {
      return raw
        .map(normalizeEntry)
        .filter(it => it && it.name !== '.' && it.name !== '..')
    }
    return []
  }
  const fs = await fsApi()
  if (!fs) throw new Error('no filesystem api')
  const raw = unwrap(await fs.readdir(String(path), { withFileTypes: true }))
  const list = raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw
  if (!Array.isArray(list)) return []
  return list.map(normalizeEntry).filter(it => it && it.name !== '.' && it.name !== '..')
}

export async function exists(path) {
  const scan = scanApi()
  if (scan && typeof scan.exists === 'function') {
    const raw = unwrap(await scan.exists(String(path)))
    return raw === true || !!(raw && typeof raw === 'object' && raw.exists === true)
  }
  const fs = await fsApi()
  if (!fs) return false
  const raw = unwrap(await fs.exists(String(path)))
  return raw === true
}

export async function stat(path) {
  const scan = scanApi()
  if (scan && typeof scan.fileInfo === 'function') {
    const raw = unwrap(await scan.fileInfo(String(path)))
    const info = raw && raw.data ? raw.data : raw
    if (!info || info.exists === false) throw new Error('not found: ' + path)
    return { size: Number(info.size || 0), isDir: !!info.isDir, mtime: Number(info.mtime || 0) }
  }
  const fs = await fsApi()
  if (!fs || typeof fs.stat !== 'function') throw new Error('no stat api')
  const raw = unwrap(await fs.stat(String(path)))
  const info = raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw
  return { size: Number(info.size || 0), isDir: !!info.isDirectory(), mtime: Number(info.mtimeMs || 0) }
}

export default { listDir, exists, stat }
