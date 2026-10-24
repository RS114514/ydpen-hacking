import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isVideoFile, extOf, joinPath, parentOf, fmtSize, scanVideos, SKIP_DIRS } from '../ui/src/utils/scan-core.js'

test('视频扩展名过滤', () => {
  assert.equal(isVideoFile('a.mp4'), true)
  assert.equal(isVideoFile('B.MKV'), true)
  assert.equal(isVideoFile('c.txt'), false)
  assert.equal(isVideoFile('无扩展名'), false)
  assert.equal(isVideoFile('.hidden.mp4'), true)
  assert.equal(extOf('x.Mp4'), 'mp4')
})

test('路径工具', () => {
  assert.equal(joinPath('/userdisk', 'a.mp4'), '/userdisk/a.mp4')
  assert.equal(joinPath('/', 'a.mp4'), '/a.mp4')
  assert.equal(parentOf('/userdisk/video/a.mp4'), '/userdisk/video')
  assert.equal(parentOf('/a.mp4'), '/')
})

test('大小格式化', () => {
  assert.equal(fmtSize(500), '500 B')
  assert.equal(fmtSize(2048), '2 KB')
  assert.equal(fmtSize(5 * 1024 * 1024), '5.0 MB')
})

// 目录树 mock：文件夹在上、视频在下，含隐藏/跳过目录
function mockFs(tree) {
  return {
    async listDir(path) {
      const list = tree[path]
      if (!list) throw new Error('not found: ' + path)
      return list
    }
  }
}

test('scanVideos 递归扫描 + 跳过系统目录 + 深度限制', async () => {
  const tree = {
    '/userdisk': [
      { name: 'video', isDir: true },
      { name: 'Favorite', isDir: true },
      { name: 'miniapp', isDir: true },      // SKIP_DIRS
      { name: 'notes.txt', isDir: false },
      { name: 'movie.mp4', isDir: false },
    ],
    '/userdisk/miniapp': [
      { name: 'hidden.mp4', isDir: false },
    ],
    '/userdisk/video': [
      { name: 'sub', isDir: true },
      { name: '.hidden', isDir: true },
      { name: 'a.mkv', isDir: false },
    ],
    '/userdisk/video/sub': [
      { name: 'deep.avi', isDir: false },
    ],
    '/userdisk/video/.hidden': [
      { name: 'secret.mp4', isDir: false },
    ],
    '/userdisk/Favorite': [
      { name: 'x.mp4', isDir: false },
    ],
  }
  const r = await scanVideos(mockFs(tree), '/userdisk', { maxDepth: 4 })
  const paths = r.videos.map(v => v.path)
  assert.ok(paths.includes('/userdisk/movie.mp4'))
  assert.ok(paths.includes('/userdisk/video/a.mkv'))
  assert.ok(paths.includes('/userdisk/video/sub/deep.avi'))
  // Favorite 是用户的视频目录，必须扫到
  assert.ok(paths.includes('/userdisk/Favorite/x.mp4'))
  assert.ok(!paths.some(p => p.includes('miniapp')))
  assert.ok(!paths.some(p => p.includes('.hidden')))
  // 一级文件夹（不含跳过目录）
  assert.deepEqual(r.folders, ['/userdisk/video', '/userdisk/Favorite'])
})

test('scanVideos maxFound 截断', async () => {
  const entries = []
  for (let i = 0; i < 50; i++) entries.push({ name: 'v' + i + '.mp4', isDir: false })
  const tree = { '/v': entries }
  const r = await scanVideos(mockFs(tree), '/v', { maxFound: 10 })
  assert.equal(r.videos.length, 10)
})

test('scanVideos 容忍读取失败目录', async () => {
  const tree = { '/x': [{ name: 'ok.mp4', isDir: false }, { name: 'bad', isDir: true }] }
  const r = await scanVideos(mockFs(tree), '/x', {})
  assert.equal(r.videos.length, 1)
  assert.ok(SKIP_DIRS.length > 5)
})
