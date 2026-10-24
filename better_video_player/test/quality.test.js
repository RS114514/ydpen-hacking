import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as quality from '../ui/src/utils/quality.js'

test('parseResolutionFromName 识别常见分辨率标注', () => {
  assert.equal(quality.parseResolutionFromName('movie_1080p.mp4').height, 1080)
  assert.equal(quality.parseResolutionFromName('Show.S01E01.720P.mkv').height, 720)
  assert.equal(quality.parseResolutionFromName('我的4K视频.mp4').height, 2160)
  assert.equal(quality.parseResolutionFromName('假期回忆 480p.avi').height, 480)
  assert.equal(quality.parseResolutionFromName('没有标注.mp4'), null)
  // 避免把普通数字当分辨率
  assert.equal(quality.parseResolutionFromName('第12话.mp4'), null)
})

test('fitInto 保持宽高比缩进目标区域', () => {
  // 1920x1080 -> 800x254：受高度限制
  const a = quality.fitInto(1920, 1080, 800, 254)
  assert.ok(a.width <= 800 && a.height <= 254)
  assert.ok(Math.abs(a.width / a.height - 16 / 9) < 0.01)
  // 640x360 -> 800x254：受高度限制，宽度允许到 ~452
  const b = quality.fitInto(640, 360, 800, 254)
  assert.ok(b.width <= 800 && b.height <= 254)
  // 小视频不放大
  const c = quality.fitInto(320, 240, 800, 254)
  assert.ok(c.width <= 320 && c.height <= 240)
})

test('decideQuality: 1080p 在 800x254 屏自动降级', () => {
  const q = quality.decideQuality({ videoW: 1920, videoH: 1080, screenW: 800, screenH: 254, mode: 'auto' })
  assert.equal(q.action, 'downscale')
  assert.ok(q.targetW <= 800 && q.targetH <= 254)
  assert.match(q.label, /1080P/)
})

test('decideQuality: 屏幕内视频不降级，360p 在 254 高的屏上仍降级', () => {
  const q = quality.decideQuality({ videoW: 1280, videoH: 720, screenW: 800, screenH: 254, mode: 'auto' })
  // 720p 宽度超出 800 → 仍需缩到屏幕内
  assert.equal(q.action, 'downscale')
  const q2 = quality.decideQuality({ videoW: 640, videoH: 360, screenW: 800, screenH: 254, mode: 'auto' })
  // 屏高只有 254：360p 高度超出 → 降级
  assert.equal(q2.action, 'downscale')
  const q3 = quality.decideQuality({ videoW: 400, videoH: 250, screenW: 800, screenH: 254, mode: 'auto' })
  assert.equal(q3.action, 'direct')
})

test('decideQuality: raw 模式不干预，unknown 分辨率不降级', () => {
  const q = quality.decideQuality({ videoW: 1920, videoH: 1080, screenW: 800, screenH: 254, mode: 'raw' })
  assert.equal(q.action, 'direct')
  const q2 = quality.decideQuality({ videoW: 0, videoH: 0, screenW: 800, screenH: 254, mode: 'auto', name: 'x.mp4' })
  assert.equal(q2.action, 'direct')
})

test('clampRate 限定在 0.25~4 范围', () => {
  assert.equal(quality.clampRate(0.5), 0.5)
  assert.equal(quality.clampRate(2), 2)
  assert.equal(quality.clampRate(1.7), 1.7)  // 任意值按原样传递（native 支持连续倍速）
  assert.equal(quality.clampRate(99), 4)
  assert.equal(quality.clampRate(0), 1)
})
