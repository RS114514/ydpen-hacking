// 设备探测：从运行时自带的 cfg.json 读取逻辑分辨率，让分页版式适配任何词典笔。
// cfg.json 形如 { screen: { width, height, direction, ... } }；
// direction 为 90/270 时 UI 是横向的（宽高互换）。
import penFs from './pen-fs.js'

let cached = null

export async function detectScreen() {
  if (cached) return cached
  let s = { w: 800, h: 254 }
  try {
    const raw = await penFs.readText('/etc/miniapp/resources/cfg.json')
    const cfg = JSON.parse(raw)
    const sc = cfg && cfg.screen
    if (sc && Number(sc.width) > 0 && Number(sc.height) > 0) {
      const d = Number(sc.direction || 0)
      s = (d === 90 || d === 270) ? { w: Number(sc.height), h: Number(sc.width) } : { w: Number(sc.width), h: Number(sc.height) }
    }
  } catch (e) {
    console.log('[device] screen detect failed, fallback 800x254: ' + e)
  }
  cached = s
  try { globalThis.$shugeScreen = s } catch (err) { /* 忽略 */ }
  return s
}

export default { detectScreen }
