// 视频库适配层：纯逻辑来自 scan-core（可单测），I/O 走 pen-fs。
import fs from './pen-fs.js'
import * as core from './scan-core.js'

export const VIDEO_EXTS = core.VIDEO_EXTS
export const SKIP_DIRS = core.SKIP_DIRS
export const SCAN_ROOTS = core.SCAN_ROOTS
export const extOf = core.extOf
export const isVideoFile = core.isVideoFile
export const parentOf = core.parentOf
export const joinPath = core.joinPath
export const fmtSize = core.fmtSize
export const scanVideos = core.scanVideos

export async function listDir(path) {
  return fs.listDir(path)
}

export async function exists(path) {
  return fs.exists(path)
}

export async function stat(path) {
  return fs.stat(path)
}

export default { listDir, exists, stat, scanVideos, isVideoFile, extOf, joinPath, parentOf, fmtSize, SKIP_DIRS, SCAN_ROOTS }
