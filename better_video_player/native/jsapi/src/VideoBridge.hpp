#pragma once

#include <quickjs/quickjs.h>

// video 模块：FFmpeg 解码 + fb 直写 + ALSA 出声（全部运行时 dlopen，无链接期依赖）
JSModuleDef* video_module_load(JSContext* ctx, const char* moduleName);
