import { test } from 'node:test'
import assert from 'node:assert/strict'
import hist from '../ui/src/utils/history.js'

test('touch 新增并置顶，同路径合并保留 playCount', () => {
  const now = 1000
  let list = hist.touch([], { path: '/a.mp4', name: 'a', positionMs: 10, durationMs: 100 }, now)
  list = hist.touch(list, { path: '/b.mp4', name: 'b', positionMs: 5, durationMs: 50 }, now + 10)
  assert.equal(list.length, 2)
  assert.equal(list[0].path, '/b.mp4')
  // 再看 a：置顶且 playCount 累加
  list = hist.touch(list, { path: '/a.mp4', name: 'a', positionMs: 50, durationMs: 100 }, now + 20)
  assert.equal(list[0].path, '/a.mp4')
  assert.equal(list[0].playCount, 2)
  assert.equal(list[0].positionMs, 50)
  assert.equal(list[0].updatedAt, now + 20)
})

test('touch 容量上限 50', () => {
  let list = []
  for (let i = 0; i < 60; i++) {
    list = hist.touch(list, { path: '/v' + i + '.mp4', name: 'v' + i, positionMs: 1 }, i)
  }
  assert.equal(list.length, hist.MAX_ENTRIES)
  assert.equal(list[0].path, '/v59.mp4')
})

test('updateProgress 只更新进度与时长，不打乱顺序', () => {
  const now = 100
  let list = hist.touch([], { path: '/a.mp4', name: 'a', positionMs: 0, durationMs: 0 }, now)
  list = hist.touch(list, { path: '/b.mp4', name: 'b', positionMs: 0, durationMs: 0 }, now + 1)
  const order = list.map(x => x.path).join()
  list = hist.updateProgress(list, '/a.mp4', 5000, 10000, now + 2)
  assert.equal(list.map(x => x.path).join(), order)
  const a = list.find(x => x.path === '/a.mp4')
  assert.equal(a.positionMs, 5000)
  assert.equal(a.durationMs, 10000)
  // 不存在的路径不新增
  const before = list.length
  assert.equal(hist.updateProgress(list, '/nope.mp4', 1, 1, now), list)
  assert.equal(list.length, before)
})

test('sorted 按 updatedAt 降序', () => {
  const sorted = hist.sorted([
    { path: '/x', updatedAt: 3 },
    { path: '/y', updatedAt: 9 },
    { path: '/z', updatedAt: 1 },
  ])
  assert.deepEqual(sorted.map(x => x.path), ['/y', '/x', '/z'])
})

test('resumeCandidate 跳过已播完的', () => {
  const cand = hist.resumeCandidate([
    { path: '/done.mp4', positionMs: 98, durationMs: 100, updatedAt: 9 },   // 98% 已看完
    { path: '/half.mp4', positionMs: 40, durationMs: 100, updatedAt: 5 },
  ])
  assert.equal(cand.path, '/half.mp4')
  // 全部看完 → null
  assert.equal(hist.resumeCandidate([{ path: '/done.mp4', positionMs: 99, durationMs: 100, updatedAt: 9 }]), null)
})

test('normalizeLoaded 兼容坏数据', () => {
  assert.deepEqual(hist.normalizeLoaded(null), { version: 1, entries: [] })
  assert.deepEqual(hist.normalizeLoaded('junk'), { version: 1, entries: [] })
  const st = hist.normalizeLoaded({ version: 1, entries: [{ path: '/a' }, null, { path: '' }] })
  assert.equal(st.entries.length, 1)
  const legacy = hist.normalizeLoaded([{ path: '/old' }])
  assert.equal(legacy.version, 1)
})
