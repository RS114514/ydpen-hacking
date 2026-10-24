// 书阁小说阅读器 · 原生 fs 模块
// 基于 miniapp-template 的 FileSystem 模块（GPL-3.0-or-later，作者 Langning Chen），
// 增加 readFileBytes：以 ArrayBuffer 返回原始字节，供 JS 侧处理 GBK 等非 UTF-8 编码。
// SPDX-License-Identifier: GPL-3.0-or-later

#include "FileSystem.hpp"

#include <dirent.h>
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#ifdef _WIN32
#include <direct.h>
#endif

#include <string>
#include <vector>

namespace {

JSValue resolved(JSContext* ctx, JSValue value)
{
    JSValue functions[2];
    JSValue promise = JS_NewPromiseCapability(ctx, functions);
    if (JS_IsException(promise)) {
        JS_FreeValue(ctx, value);
        return promise;
    }

    JSValue result = JS_Call(ctx, functions[0], JS_UNDEFINED, 1, &value);
    JS_FreeValue(ctx, result);
    JS_FreeValue(ctx, functions[0]);
    JS_FreeValue(ctx, functions[1]);
    JS_FreeValue(ctx, value);
    return promise;
}

JSValue rejected(JSContext* ctx, const char* operation, const char* path, int errorNumber)
{
    JSValue error = JS_NewError(ctx);
    std::string message = std::string(operation) + " " + (path ? path : "") + ": " + strerror(errorNumber);
    JS_SetPropertyStr(ctx, error, "message", JS_NewString(ctx, message.c_str()));
    JS_SetPropertyStr(ctx, error, "operation", JS_NewString(ctx, operation));
    JS_SetPropertyStr(ctx, error, "path", JS_NewString(ctx, path ? path : ""));
    JS_SetPropertyStr(ctx, error, "errno", JS_NewInt32(ctx, errorNumber));

    JSValue functions[2];
    JSValue promise = JS_NewPromiseCapability(ctx, functions);
    if (JS_IsException(promise)) {
        JS_FreeValue(ctx, error);
        return promise;
    }

    JSValue result = JS_Call(ctx, functions[1], JS_UNDEFINED, 1, &error);
    JS_FreeValue(ctx, result);
    JS_FreeValue(ctx, functions[0]);
    JS_FreeValue(ctx, functions[1]);
    JS_FreeValue(ctx, error);
    return promise;
}

JSValue invalidArgument(JSContext* ctx, const char* operation)
{
    return rejected(ctx, operation, "", EINVAL);
}

bool getPath(JSContext* ctx, int argc, JSValueConst* argv, std::string& path)
{
    if (argc < 1) return false;
    const char* value = JS_ToCString(ctx, argv[0]);
    if (!value) return false;
    path.assign(value);
    JS_FreeCString(ctx, value);
    return !path.empty();
}

JSValue nodeIsFile(JSContext* ctx, JSValueConst thisValue, int, JSValueConst*)
{
    JSValue value = JS_GetPropertyStr(ctx, thisValue, "_isFile");
    const int result = JS_ToBool(ctx, value);
    JS_FreeValue(ctx, value);
    return JS_NewBool(ctx, result > 0);
}

JSValue nodeIsDirectory(JSContext* ctx, JSValueConst thisValue, int, JSValueConst*)
{
    JSValue value = JS_GetPropertyStr(ctx, thisValue, "_isDirectory");
    const int result = JS_ToBool(ctx, value);
    JS_FreeValue(ctx, value);
    return JS_NewBool(ctx, result > 0);
}

void setTypeMethods(JSContext* ctx, JSValue object, bool isFile, bool isDirectory)
{
    JS_SetPropertyStr(ctx, object, "_isFile", JS_NewBool(ctx, isFile));
    JS_SetPropertyStr(ctx, object, "_isDirectory", JS_NewBool(ctx, isDirectory));
    JS_SetPropertyStr(ctx, object, "isFile", JS_NewCFunction(ctx, nodeIsFile, "isFile", 0));
    JS_SetPropertyStr(ctx, object, "isDirectory", JS_NewCFunction(ctx, nodeIsDirectory, "isDirectory", 0));
}

std::string childPath(const std::string& parent, const char* child)
{
    if (parent.empty() || parent[parent.size() - 1] == '/') return parent + child;
    return parent + "/" + child;
}

bool readEntryType(const std::string& parent, const dirent* entry, bool& isFile, bool& isDirectory)
{
    isFile = false;
    isDirectory = false;
#ifdef DT_REG
    if (entry->d_type == DT_REG) {
        isFile = true;
        return true;
    }
    if (entry->d_type == DT_DIR) {
        isDirectory = true;
        return true;
    }
    if (entry->d_type != DT_UNKNOWN && entry->d_type != DT_LNK) return true;
#endif
    struct stat info;
    if (stat(childPath(parent, entry->d_name).c_str(), &info) != 0) return false;
    isFile = S_ISREG(info.st_mode);
    isDirectory = S_ISDIR(info.st_mode);
    return true;
}

JSValue fsReaddir(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv)
{
    std::string path;
    if (!getPath(ctx, argc, argv, path)) return invalidArgument(ctx, "readdir");

    bool withFileTypes = false;
    if (argc > 1 && JS_IsObject(argv[1])) {
        JSValue option = JS_GetPropertyStr(ctx, argv[1], "withFileTypes");
        const int enabled = JS_ToBool(ctx, option);
        JS_FreeValue(ctx, option);
        withFileTypes = enabled > 0;
    }

    DIR* directory = opendir(path.c_str());
    if (!directory) return rejected(ctx, "readdir", path.c_str(), errno);

    JSValue array = JS_NewArray(ctx);
    uint32_t index = 0;
    errno = 0;
    while (dirent* entry = readdir(directory)) {
        if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0) continue;

        JSValue value;
        if (withFileTypes) {
            bool isFile = false;
            bool isDirectory = false;
            readEntryType(path, entry, isFile, isDirectory);
            value = JS_NewObject(ctx);
            JS_SetPropertyStr(ctx, value, "name", JS_NewString(ctx, entry->d_name));
            setTypeMethods(ctx, value, isFile, isDirectory);
        } else {
            value = JS_NewString(ctx, entry->d_name);
        }
        JS_SetPropertyUint32(ctx, array, index++, value);
    }
    const int readError = errno;
    closedir(directory);
    if (readError != 0) {
        JS_FreeValue(ctx, array);
        return rejected(ctx, "readdir", path.c_str(), readError);
    }
    return resolved(ctx, array);
}

JSValue fsStat(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv)
{
    std::string path;
    if (!getPath(ctx, argc, argv, path)) return invalidArgument(ctx, "stat");

    struct stat info;
    if (stat(path.c_str(), &info) != 0) return rejected(ctx, "stat", path.c_str(), errno);

    JSValue result = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, result, "size", JS_NewInt64(ctx, static_cast<int64_t>(info.st_size)));
    JS_SetPropertyStr(ctx, result, "mode", JS_NewInt32(ctx, static_cast<int32_t>(info.st_mode)));
    JS_SetPropertyStr(ctx, result, "mtimeMs", JS_NewFloat64(ctx, static_cast<double>(info.st_mtime) * 1000.0));
    setTypeMethods(ctx, result, S_ISREG(info.st_mode), S_ISDIR(info.st_mode));
    return resolved(ctx, result);
}

JSValue fsExists(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv)
{
    std::string path;
    if (!getPath(ctx, argc, argv, path)) return resolved(ctx, JS_FALSE);
    struct stat info;
    return resolved(ctx, JS_NewBool(ctx, stat(path.c_str(), &info) == 0));
}

int createDirectory(const char* path)
{
#ifdef _WIN32
    return _mkdir(path);
#else
    return mkdir(path, 0777);
#endif
}

bool statWithoutFollowingLinks(const char* path, struct stat* info)
{
#ifdef _WIN32
    return stat(path, info) == 0;
#else
    return lstat(path, info) == 0;
#endif
}

bool isSymbolicLink(const struct stat& info)
{
#ifdef _WIN32
    (void)info;
    return false;
#else
    return S_ISLNK(info.st_mode);
#endif
}

bool makeDirectoryRecursive(const std::string& rawPath)
{
    std::string path = rawPath;
    while (path.size() > 1 && path[path.size() - 1] == '/') path.resize(path.size() - 1);
    if (path.empty()) return false;

    struct stat info;
    if (stat(path.c_str(), &info) == 0) return S_ISDIR(info.st_mode);

    for (size_t index = 1; index <= path.size(); ++index) {
        if (index != path.size() && path[index] != '/') continue;
        const std::string part = path.substr(0, index);
        if (part.empty() || part == "/") continue;
        if (createDirectory(part.c_str()) != 0 && errno != EEXIST) return false;
        if (stat(part.c_str(), &info) != 0 || !S_ISDIR(info.st_mode)) return false;
    }
    return true;
}

JSValue fsMkdir(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv)
{
    std::string path;
    if (!getPath(ctx, argc, argv, path)) return invalidArgument(ctx, "mkdir");
    if (makeDirectoryRecursive(path)) return resolved(ctx, JS_TRUE);
    return rejected(ctx, "mkdir", path.c_str(), errno ? errno : EIO);
}

bool removeRecursive(const std::string& path)
{
    struct stat info;
    if (!statWithoutFollowingLinks(path.c_str(), &info)) return errno == ENOENT;

    if (!S_ISDIR(info.st_mode) || isSymbolicLink(info)) return unlink(path.c_str()) == 0;

    DIR* directory = opendir(path.c_str());
    if (!directory) return false;
    bool success = true;
    while (dirent* entry = readdir(directory)) {
        if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0) continue;
        if (!removeRecursive(childPath(path, entry->d_name))) {
            success = false;
            break;
        }
    }
    closedir(directory);
    return success && rmdir(path.c_str()) == 0;
}

JSValue fsRm(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv)
{
    std::string path;
    if (!getPath(ctx, argc, argv, path)) return invalidArgument(ctx, "rm");
    if (removeRecursive(path)) return resolved(ctx, JS_TRUE);
    return rejected(ctx, "rm", path.c_str(), errno ? errno : EIO);
}

JSValue fsReadFile(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv)
{
    std::string path;
    if (!getPath(ctx, argc, argv, path)) return invalidArgument(ctx, "readFile");

    FILE* file = fopen(path.c_str(), "rb");
    if (!file) return rejected(ctx, "readFile", path.c_str(), errno);
    if (fseek(file, 0, SEEK_END) != 0) {
        const int errorNumber = errno;
        fclose(file);
        return rejected(ctx, "readFile", path.c_str(), errorNumber);
    }
    const long length = ftell(file);
    if (length < 0) {
        const int errorNumber = errno;
        fclose(file);
        return rejected(ctx, "readFile", path.c_str(), errorNumber);
    }
    rewind(file);

    std::vector<char> data(static_cast<size_t>(length));
    if (length > 0 && fread(data.data(), 1, static_cast<size_t>(length), file) != static_cast<size_t>(length)) {
        const int errorNumber = ferror(file) ? EIO : errno;
        fclose(file);
        return rejected(ctx, "readFile", path.c_str(), errorNumber);
    }
    fclose(file);
    return resolved(ctx, JS_NewStringLen(ctx, data.empty() ? "" : data.data(), data.size()));
}

// readFileBytes：整文件原始字节 -> ArrayBuffer
JSValue fsReadFileBytes(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv)
{
    std::string path;
    if (!getPath(ctx, argc, argv, path)) return invalidArgument(ctx, "readFileBytes");

    FILE* file = fopen(path.c_str(), "rb");
    if (!file) return rejected(ctx, "readFileBytes", path.c_str(), errno);
    if (fseek(file, 0, SEEK_END) != 0) {
        const int errorNumber = errno;
        fclose(file);
        return rejected(ctx, "readFileBytes", path.c_str(), errorNumber);
    }
    const long length = ftell(file);
    if (length < 0) {
        const int errorNumber = errno;
        fclose(file);
        return rejected(ctx, "readFileBytes", path.c_str(), errorNumber);
    }
    rewind(file);

    std::vector<char> data(static_cast<size_t>(length));
    if (length > 0 && fread(data.data(), 1, static_cast<size_t>(length), file) != static_cast<size_t>(length)) {
        const int errorNumber = ferror(file) ? EIO : errno;
        fclose(file);
        return rejected(ctx, "readFileBytes", path.c_str(), errorNumber);
    }
    fclose(file);

    if (data.empty()) return resolved(ctx, JS_NewArrayBuffer(ctx, NULL, 0, NULL, NULL, 0));
    return resolved(ctx, JS_NewArrayBufferCopy(ctx, reinterpret_cast<const uint8_t*>(data.data()), data.size()));
}

JSValue fsWriteFile(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv)
{
    std::string path;
    if (!getPath(ctx, argc, argv, path) || argc < 2) return invalidArgument(ctx, "writeFile");

    size_t length = 0;
    const char* data = JS_ToCStringLen(ctx, &length, argv[1]);
    if (!data) return invalidArgument(ctx, "writeFile");

    FILE* file = fopen(path.c_str(), "wb");
    if (!file) {
        const int errorNumber = errno;
        JS_FreeCString(ctx, data);
        return rejected(ctx, "writeFile", path.c_str(), errorNumber);
    }
    const size_t written = fwrite(data, 1, length, file);
    const int closeResult = fclose(file);
    JS_FreeCString(ctx, data);
    if (written != length || closeResult != 0) return rejected(ctx, "writeFile", path.c_str(), EIO);
    return resolved(ctx, JS_TRUE);
}

int fsModuleInit(JSContext* ctx, JSModuleDef* module)
{
    JSValue fs = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, fs, "readdir", JS_NewCFunction(ctx, fsReaddir, "readdir", 2));
    JS_SetPropertyStr(ctx, fs, "stat", JS_NewCFunction(ctx, fsStat, "stat", 1));
    JS_SetPropertyStr(ctx, fs, "exists", JS_NewCFunction(ctx, fsExists, "exists", 1));
    JS_SetPropertyStr(ctx, fs, "mkdir", JS_NewCFunction(ctx, fsMkdir, "mkdir", 1));
    JS_SetPropertyStr(ctx, fs, "rm", JS_NewCFunction(ctx, fsRm, "rm", 1));
    JS_SetPropertyStr(ctx, fs, "unlink", JS_NewCFunction(ctx, fsRm, "unlink", 1));
    JS_SetPropertyStr(ctx, fs, "readFile", JS_NewCFunction(ctx, fsReadFile, "readFile", 1));
    JS_SetPropertyStr(ctx, fs, "readFileBytes", JS_NewCFunction(ctx, fsReadFileBytes, "readFileBytes", 1));
    JS_SetPropertyStr(ctx, fs, "writeFile", JS_NewCFunction(ctx, fsWriteFile, "writeFile", 2));
    JS_SetModuleExport(ctx, module, "default", fs);
    return 0;
}

}  // namespace

JSModuleDef* fs_module_load(JSContext* ctx, const char* moduleName)
{
    if (!moduleName || strcmp(moduleName, "fs") != 0) return NULL;
    JSModuleDef* module = JS_NewCModule(ctx, moduleName, fsModuleInit);
    if (!module) return NULL;
    JS_AddModuleExport(ctx, module, "default");
    return module;
}
