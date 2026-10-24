// 播放桥接层：优先原生模块 video（libjsapi_better_video.so，GStreamer）。
// 模块缺失时降级为「不可播放」并给页面稳定错误，页面不感知实现差异。
// 原生模块契约（均为同步返回）：
//   play({path, screenW, screenH, maxW, maxH, rate, volume}) -> {ok, error?, videoW?, videoH?}
//   pause()/resume()/stop() -> {ok}
//   seek(ms) -> {ok}          setRate(rate) -> {ok}     setVolume(0..100) -> {ok}
//   getPosition() -> {ms}     getDuration() -> {ms}
//   getStatus() -> {playing, eos, videoW, videoH, ok}

let modState = undefined // undefined=未探测, false=不可用, 否则为模块对象

async function api() {
  if (modState !== undefined) return modState || null
  try {
    const m = await import('video')
    const mod = m && (m.default || m)
    if (mod && typeof mod.play === 'function') {
      modState = mod
      return mod
    }
  } catch (e) { /* 模块不存在 */ }
  modState = false
  return null
}

function num(v, fallback) {
  const n = Number(v)
  return isFinite(n) ? n : fallback
}

export async function available() {
  return !!(await api())
}

export async function play(opt) {
  const mod = await api()
  if (!mod) return { ok: false, error: 'no-video-module' }
  try {
    const r = mod.play({
      path: String(opt.path || ''),
      screenW: num(opt.screenW, 800),
      screenH: num(opt.screenH, 254),
      rectX: num(opt.rectX, 0),
      rectY: num(opt.rectY, 0),
      rectW: num(opt.rectW, 800),
      rectH: num(opt.rectH, 192),
      maxW: num(opt.maxW, 0),
      maxH: num(opt.maxH, 0),
      // native 契约：ratePermillage（1000 = 1.0x）
      ratePermillage: Math.round(num(opt.rate, 1) * 1000),
      volume: num(opt.volume, 70),
    })
    return r && typeof r === 'object' ? r : { ok: !!r }
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) }
  }
}

export async function simple(name, arg) {
  const mod = await api()
  if (!mod || typeof mod[name] !== 'function') return { ok: false, error: 'no-video-module' }
  try {
    const r = arg === undefined ? mod[name]() : mod[name](arg)
    if (r && typeof r === 'object') return r
    return { ok: r !== false }
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) }
  }
}

// 切换视频显示区域（控制栏唤出时收缩视频，避免遮挡）
export const setView = opt => simple('setView', {
  rectX: num(opt && opt.rectX, 0),
  rectY: num(opt && opt.rectY, 0),
  rectW: num(opt && opt.rectW, 800),
  rectH: num(opt && opt.rectH, 254),
})

export const pause = () => simple('pause')
export const resume = () => simple('resume')
export const stop = () => simple('stop')
export const seek = ms => simple('seek', Math.max(0, Math.round(Number(ms) || 0)))
export const setRate = r => simple('setRate', Number(r) || 1)
export const setVolume = v => simple('setVolume', Math.min(100, Math.max(0, Math.round(Number(v) || 0))))

export async function position() {
  const r = await simple('getPosition')
  return r && num(r.ms, 0) || 0
}

export async function duration() {
  const r = await simple('getDuration')
  return r && num(r.ms, 0) || 0
}

export async function status() {
  const mod = await api()
  if (!mod || typeof mod.getStatus !== 'function') return { ok: false, playing: false, eos: false, videoW: 0, videoH: 0 }
  try {
    const r = mod.getStatus()
    return r && typeof r === 'object' ? r : { ok: false, playing: false, eos: false, videoW: 0, videoH: 0 }
  } catch (e) {
    return { ok: false, playing: false, eos: false, videoW: 0, videoH: 0 }
  }
}

export default { available, play, pause, resume, stop, seek, setRate, setVolume, setView, position, duration, status }
