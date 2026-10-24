// 展示格式化：纯函数
export function fmtTime(ms) {
  const total = Math.max(0, Math.round((Number(ms) || 0) / 1000))
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss
}

export function fmtPercent(posMs, durMs) {
  const dur = Number(durMs) || 0
  if (dur <= 0) return 0
  return Math.min(100, Math.max(0, Math.round(((Number(posMs) || 0) / dur) * 100)))
}

export default { fmtTime, fmtPercent }
