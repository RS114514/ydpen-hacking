// 画质决策：1080p 等高分辨率视频在小屏（800×254 逻辑 / 254×800 物理）上自动降画质，
// 优先保证流畅（降低解码输出分辨率），这是纯逻辑，native 侧按 targetW/H 做 capsfilter。
// 分辨率来源优先级：播放器探测到的真实分辨率 > 文件名提示 > 默认。

// 从文件名解析分辨率提示，如 "movie_1080p.mp4"、"4K"、"720P"
export function parseResolutionFromName(name) {
  const s = String(name || '').toLowerCase()
  const m = s.match(/(\d{3,4})\s*[px]/)
  if (m) {
    const h = parseInt(m[1], 10)
    if (h >= 144 && h <= 4320) return { width: Math.round(h * 16 / 9), height: h, from: 'name' }
  }
  if (/(^|[^0-9a-z])4k([^0-9a-z]|$)/.test(s)) return { width: 3840, height: 2160, from: 'name' }
  if (/(^|[^0-9a-z])2k([^0-9a-z]|$)/.test(s)) return { width: 2560, height: 1440, from: 'name' }
  return null
}

// 保持宽高比，把视频缩到不超过 maxW × maxH；小视频不放大
export function fitInto(videoW, videoH, maxW, maxH) {
  const w = Number(videoW) || 0
  const h = Number(videoH) || 0
  const mw = Number(maxW) || 1
  const mh = Number(maxH) || 1
  if (w <= 0 || h <= 0) return { width: Math.min(w, mw), height: Math.min(h, mh) }
  const scale = Math.min(1, mw / w, mh / h)
  return { width: Math.max(2, Math.round(w * scale)), height: Math.max(2, Math.round(h * scale)) }
}

// mode: 'auto'（1080p 及以上降画质）| 'smooth'（一律降到屏幕内）| 'raw'（不干预）
export function decideQuality(opt) {
  const screenW = Number(opt.screenW) || 800
  const screenH = Number(opt.screenH) || 254
  const mode = opt.mode || 'auto'
  const hinted = opt.videoW > 0 ? { width: opt.videoW, height: opt.videoH, from: 'probe' }
    : parseResolutionFromName(opt.name)

  if (mode === 'raw' || !hinted) {
    return { action: 'direct', targetW: 0, targetH: 0, label: '原始画质', videoW: hinted ? hinted.width : 0, videoH: hinted ? hinted.height : 0 }
  }
  const exceeds = hinted.width > screenW || hinted.height > screenH
  if (mode === 'auto' && !exceeds) {
    return { action: 'direct', targetW: 0, targetH: 0, label: '原始画质', videoW: hinted.width, videoH: hinted.height }
  }
  // 降画质：目标是屏幕大小（显示层仍保持比例，此处限制解码输出上限）
  const t = fitInto(hinted.width, hinted.height, screenW, screenH)
  return {
    action: 'downscale',
    targetW: t.width,
    targetH: t.height,
    label: hinted.height >= 1080 ? '1080P 已降至流畅画质' : ('已降至 ' + t.width + '×' + t.height),
    videoW: hinted.width,
    videoH: hinted.height,
  }
}

export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

// 倍速合法性（native seek 用）
export function clampRate(r) {
  const n = Number(r) || 1
  for (let i = 0; i < RATES.length; i++) {
    if (Math.abs(RATES[i] - n) < 0.001) return RATES[i]
  }
  return Math.min(4, Math.max(0.25, n))
}

export default { parseResolutionFromName, fitInto, decideQuality, clampRate, RATES }
