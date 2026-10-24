#pragma once

#include <quickjs/quickjs.h>

JSModuleDef* fs_module_load(JSContext* ctx, const char* moduleName);
