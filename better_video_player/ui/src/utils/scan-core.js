// 视频扫描纯逻辑：无 Falcon/原生依赖，node --test 可直接验证。
// library.js 在此基础上叠加 pen-fs 适配层。

export const VIDEO_EXTS = ['mp4', 'mkv', 'avi', 'mov', 'm4v', '3gp', 'webm', 'ts', 'flv', 'mpg', 'mpeg', 'wmv']

// 系统目录与巨型媒体目录，扫描时跳过。
// 注意：不要跳过 Favorite —— 真机上用户的视频就放在 /userdisk/Favorite/ 下。
export const SKIP_DIRS = ['miniapp', 'lost+found', 'pstore', 'database', 'corefile', 'swap',
  'record', 'Music', 'Pictures', 'browser', 'mcserver', 'tailscale',
  'cloudbrowser-update', 'adb_persist', 'uresource', 'opt', '.git']

export function extOf(name) {
  const s = String(name || '')
  const i = s.lastIndexOf('.')
  if (i <= 0) return ''
  return s.slice(i + 1).toLowerCase()
}

export function isVideoFile(name) {
  return VIDEO_EXTS.indexOf(extOf(name)) !== -1
}

export function parentOf(path) {
  const i = String(path).lastIndexOf('/')
  if (i <= 0) return '/'
  return String(path).slice(0, i)
}

export function joinPath(dir, name) {
  if (!dir || dir === '/') return '/' + name
  return dir + '/' + name
}

export function fmtSize(n) {
  n = Number(n) || 0
  if (n >= 1024 * 1024 * 1024) return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n >= 1024) return Math.round(n / 1024) + ' KB'
  return n + ' B'
}

// 有限深度递归扫描。fsAdapter: { listDir(path) -> [{name,isDir}] }（注入便于 mock 测试）。
export async function scanVideos(fsAdapter, root, opts) {
  const o = opts || {}
  const maxDepth = o.maxDepth == null ? 4 : o.maxDepth
  const maxFound = o.maxFound == null ? 200 : o.maxFound
  const found = []
  const folders = []
  let scannedDirs = 0

  async function walk(dir, depth) {
    if (found.length >= maxFound) return
    scannedDirs++
    let list = []
    try {
      list = await fsAdapter.listDir(dir)
    } catch (e) {
      return
    }
    const dirs = []
    for (const it of list) {
      if (!it || it.name == null || it.name.charAt(0) === '.') continue
      if (it.isDir) {
        if (SKIP_DIRS.indexOf(it.name) !== -1) continue
        dirs.push(it.name)
      } else if (isVideoFile(it.name)) {
        found.push({ path: joinPath(dir, it.name), name: it.name, dir })
      }
    }
    if (depth === 0) {
      for (const name of dirs) folders.push(joinPath(dir, name))
    }
    if (depth < maxDepth) {
      for (const name of dirs) {
        if (found.length >= maxFound) break
        await walk(joinPath(dir, name), depth + 1)
      }
    }
  }

  await walk(root, 0)
  found.sort((a, b) => (a.dir === b.dir ? (a.name < b.name ? -1 : 1) : (a.dir < b.dir ? -1 : 1)))
  return { videos: found.slice(0, maxFound), folders, scannedDirs }
}

// 扫描常用根目录（存在哪个扫哪个）
export const SCAN_ROOTS = ['/userdisk', '/sdcard', '/storage/emulated/0', '/data/cfg', '/tmp']
