// 更好的视频播放器 · 原生模块注册：fs（文件扫描/持久化） + video（FFmpeg 播放引擎）。
// 不注册 custom（armv7-glibc 笔上已有原生 custom.scan，重复注册同一模块名会冲突）。
//
// 基于 miniapp-template 的 JSAPI 骨架（GPL-3.0-or-later，作者 Langning Chen）。
// SPDX-License-Identifier: GPL-3.0-or-later

#include "JSAPI.hpp"
#include "FileSystem.hpp"
#include "VideoBridge.hpp"

#include <jsmodules/JSCModuleExtension.h>
#include <quickjs/quickjs.h>

#include <cstring>

extern "C" JQUICK_EXPORT void custom_init_jsapis()
{
    registerCModuleLoader("fs", &fs_module_load);
    registerCModuleLoader("video", &video_module_load);
}
