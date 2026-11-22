#!/usr/bin/env python3
"""Local-only Linux/aarch64 build. No package installs, source edits, or device writes.

python3 -S tools/build_native.py --fetch --prepare --deps --game --verify
Use --help for paths. Sources and hashes are locked; completed dependency builds
are reusable. The sysroot is an SDK overlay, NOT a replacement for Zig's glibc.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import shutil
import struct
import subprocess
import tarfile

PROJECT = Path(__file__).resolve().parents[1]
DEFAULT_CACHE = Path('/Volumes/500GB/qoder_cache/pvz_deps')
DEFAULT_ZIG = Path('/Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig')
TARGET = 'aarch64-linux-gnu.2.29'
# Verified upstream release tags, resolved to immutable commits (not moving branches).
SOURCES = {
    'zlib': ('madler/zlib', 'v1.3.1', '51b7f2abdade71cd9bb0e7a373ef2610ec6f9daf'),
    'png': ('pnggroup/libpng', 'v1.6.58', '3061454d980de7d53608f594194cfac722721d2a'),
    'jpeg': ('libjpeg-turbo/libjpeg-turbo', '3.1.3', 'af9c1c268520a29adf98cad5138dafe612b3d318'),
    'ogg': ('xiph/ogg', 'v1.3.6', 'be05b13e98b048f0b5a0f5fa8ce514d56db5f822'),
    'vorbis': ('xiph/vorbis', 'v1.3.7', '0657aee69dec8508a0011f47f3b69d7538e9d262'),
    'sdl': ('libsdl-org/SDL', 'release-3.4.20', 'f00dc919ca35b9756316e86c4777392de442f9b2'),
    'mixer': ('libsdl-org/SDL_mixer', 'release-3.2.4', '72a81869b45e249e8e67102db4e98dd2441f05a1'),
    'openmpt': ('OpenMPT/openmpt', 'libopenmpt-0.8.4', '327204eaa2c27bd1acbb571babe68f279c85238b'),
    'wayland': ('wayland-mirror/wayland', '1.21.0', '8135e856ebd79872f886466e9cee39affb7d9ee8'),
    'xkbcommon': ('xkbcommon/libxkbcommon', 'xkbcommon-1.5.0', 'cecaa01df18925eb66c6a81f6e4b7167421d45f2'),
}


def validate_target(target):
    match = re.fullmatch(r'aarch64-linux-gnu\.(\d+)\.(\d+)', target)
    if not match or not (2, 17) <= tuple(map(int, match.groups())) <= (2, 29):
        raise ValueError('Target must be aarch64-linux-gnu with explicit glibc 2.17..2.29')
    return target


def validate_paths(source, cache):
    source, cache = Path(source).resolve(), Path(cache).resolve()
    if source == cache or source in cache.parents or cache in source.parents:
        raise ValueError('Source and writable cache must not overlap')
    if not source.is_dir():
        raise ValueError('Game source directory does not exist: ' + str(source))
    if not cache.is_absolute() or cache == Path('/'):
        raise ValueError('Cache must be a dedicated absolute directory')


def safe_extract(archive, destination):
    """Validate every member before writing; links must remain inside extraction.

    Files beneath archive symlinks and special devices are rejected. Internal
    framework symlinks are created last, so they cannot redirect file writes.
    """
    destination = Path(destination)
    if destination.exists():
        raise ValueError('Extraction destination must not already exist')
    with tarfile.open(archive, 'r:*') as tar:
        members = tar.getmembers()
        links = {PurePosixPath(item.name) for item in members if item.issym() or item.islnk()}
        root = destination.resolve()
        for item in members:
            path = PurePosixPath(item.name)
            if path.is_absolute() or '..' in path.parts or '\\' in item.name:
                raise ValueError('Unsafe archive path: ' + item.name)
            if any(parent in links for parent in path.parents):
                raise ValueError('Archive member beneath a symlink: ' + item.name)
            if item.issym() or item.islnk():
                target = PurePosixPath(item.linkname)
                base = root / path.parent if item.issym() else root
                resolved = (base / str(target)).resolve()
                if target.is_absolute() or '\\' in item.linkname or root not in resolved.parents:
                    raise ValueError('Unsafe archive link: ' + item.name)
            elif not (item.isfile() or item.isdir()):
                raise ValueError('Archive devices are not allowed: ' + item.name)
        destination.mkdir(parents=True)
        for item in members:
            path = destination.joinpath(*PurePosixPath(item.name).parts)
            if item.isdir():
                path.mkdir(parents=True, exist_ok=True)
            elif item.isfile():
                path.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(item) as src, path.open('wb') as dst:
                    shutil.copyfileobj(src, dst)
                if item.mode & 0o111:
                    path.chmod(item.mode & 0o777)
        for item in members:
            if item.issym() or item.islnk():
                path = destination / item.name
                path.parent.mkdir(parents=True, exist_ok=True)
                if item.issym():
                    path.symlink_to(item.linkname)
                else:
                    os.link(destination / item.linkname, path)
        for item in members:
            if item.issym() and root not in (destination / item.name).resolve().parents:
                raise ValueError('Archive symlink chain escapes destination: ' + item.name)


def archive_root(directory):
    children = []
    for path in Path(directory).iterdir():
        if path.name.startswith('._') and path.is_file():
            with path.open('rb') as stream:
                if stream.read(4) == bytes.fromhex('00051607'):
                    continue
        children.append(path)
    if len(children) != 1 or not children[0].is_dir():
        raise ValueError('Expected exactly one archive root: ' + str(directory))
    return children[0]


def cross_environment(prefix, sysroot, original=None):
    env = dict(os.environ if original is None else original)
    for key in ('CPATH', 'C_INCLUDE_PATH', 'CPLUS_INCLUDE_PATH', 'LIBRARY_PATH',
                'CFLAGS', 'CXXFLAGS', 'CPPFLAGS', 'LDFLAGS', 'SDKROOT',
                'MACOSX_DEPLOYMENT_TARGET', 'PKG_CONFIG_SYSROOT_DIR', 'CMAKE_PREFIX_PATH'):
        env.pop(key, None)
    env['PKG_CONFIG_PATH'] = ''
    env['PKG_CONFIG_LIBDIR'] = os.pathsep.join(str(p / d) for p in (prefix, sysroot)
                                            for d in ('lib/pkgconfig', 'share/pkgconfig'))
    env['COPYFILE_DISABLE'] = '1'
    return env


def validate_elf(path):
    with Path(path).open('rb') as file:
        data = file.read(64)
    if len(data) < 20 or data[:6] != b'\x7fELF\x02\x01' or struct.unpack_from('<H', data, 18)[0] != 183:
        raise ValueError('Not a little-endian ELF64 AArch64 object: ' + str(path))


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def run(command, cwd=None, env=None):
    command = [str(x) for x in command]
    print('+ ' + shlex.join(command), flush=True)
    subprocess.run(command, cwd=cwd, env=env, check=True)


def sdl_options():
    enabled = ('STATIC', 'WAYLAND', 'WAYLAND_SHARED', 'ALSA', 'ALSA_SHARED', 'OPENGLES')
    disabled = ('SHARED', 'TESTS', 'TEST_LIBRARY', 'EXAMPLES', 'X11', 'VULKAN',
                'OPENGL', 'PIPEWIRE', 'PULSEAUDIO', 'JACK', 'SNDIO', 'DBUS', 'IBUS',
                'LIBUDEV', 'HIDAPI', 'JOYSTICK', 'HAPTIC', 'SENSOR', 'CAMERA',
                'KMSDRM', 'WAYLAND_LIBDECOR', 'SYSTEM_ICONV', 'GPU', 'RENDER_GPU',
                'RENDER_VULKAN', 'OPENVR', 'OFFSCREEN')
    return ['-DSDL_' + key + '=ON' for key in enabled] + ['-DSDL_' + key + '=OFF' for key in disabled]


def openmpt_options():
    # NO_MPG123/NO_VORBIS here select the documented *embedded* fallbacks, not
    # missing music support. The pinned Makefile compiles minimp3/stb_vorbis/miniz
    # into libopenmpt.a. This preserves MO3 MP3/Ogg and archive decoding while
    # making OPENMPT_LINKS_STANDALONE succeed in the unmodified engine CMake.
    # DYNLINK=0 is required as well: the pinned Makefile adds libopenmpt.so to
    # OUTPUTS whenever DYNLINK=1, independently of SHARED_LIB.
    return ['CONFIG=clang', 'IS_CROSS=1', 'STDCXX=c++20', 'STDC=c11',
            'STATIC_LIB=1', 'SHARED_LIB=0', 'DYNLINK=0', 'EXAMPLES=0', 'OPENMPT123=0', 'TEST=0',
            'OPTIMIZE=speed', 'NO_ZLIB=1', 'NO_MPG123=1', 'NO_OGG=1',
            'NO_VORBIS=1', 'NO_VORBISFILE=1', 'NO_MINIZ=0', 'NO_MINIMP3=0',
            'NO_STBVORBIS=0', 'NO_PORTAUDIO=1', 'NO_PORTAUDIOCPP=1',
            'NO_PULSEAUDIO=1', 'NO_SDL2=1', 'NO_FLAC=1', 'NO_SNDFILE=1']


class Builder:
    def __init__(self, args):
        self.args = args
        self.cache = args.cache.resolve()
        self.prefix = self.cache / 'install'
        self.sysroot = self.cache / 'sysroot'
        self.bin = self.cache / 'host/bin'
        self.src = self.cache / 'sources'
        self.build = self.cache / 'build'
        self.target = validate_target(args.target)
        validate_paths(args.source, args.cache)
        for path in (self.prefix, self.sysroot, self.bin, self.src, self.build,
                     self.cache / 'downloads', self.cache / 'logs'):
            path.mkdir(parents=True, exist_ok=True)
        self.env = cross_environment(self.prefix, self.sysroot)
        self.env.update(ZIG_GLOBAL_CACHE_DIR=str(args.zig_cache),
                        ZIG_LOCAL_CACHE_DIR=str(self.cache / 'zig-local-cache'),
                        YDPEN_DEPS_PREFIX=str(self.prefix), YDPEN_SYSROOT=str(self.sysroot),
                        YDPEN_TOOL_BIN=str(self.bin), YDPEN_TARGET=self.target)
        self.env['PATH'] = str(self.bin) + os.pathsep + str(args.cmake.parent) + os.pathsep + self.env['PATH']

    def fetch(self):
        manifest_path = self.cache / 'sources.lock.json'
        manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
        for name, (repo, tag, commit) in SOURCES.items():
            archive = self.cache / 'downloads' / (name + '-' + commit + '.tar.gz')
            if not archive.exists():
                partial = archive.with_suffix('.partial')
                with partial.open('wb') as stream:
                    subprocess.run(['gh', 'api', 'repos/' + repo + '/tarball/' + commit],
                                   stdout=stream, check=True)
                partial.rename(archive)
            sha = digest(archive)
            if name in manifest and manifest[name]['sha256'] != sha:
                raise ValueError('Cached source checksum changed: ' + name)
            manifest[name] = dict(repo=repo, tag=tag, commit=commit, sha256=sha)
            manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
            destination = self.src / name
            if not destination.exists():
                unpack = self.src / (name + '.extracting')
                if unpack.exists():
                    shutil.rmtree(unpack)
                safe_extract(archive, unpack)
                archive_root(unpack).rename(destination)
                shutil.rmtree(unpack)
            print('Source ready: ' + name + ' ' + tag + ' ' + sha, flush=True)

    def wrappers(self):
        if not self.args.zig.is_file():
            raise ValueError('Zig executable missing: ' + str(self.args.zig))
        for name, mode in (('cc', 'cc'), ('c++', 'c++'), ('ar', 'ar'), ('ranlib', 'ranlib')):
            command = [str(self.args.zig), mode]
            if mode in ('cc', 'c++'):
                command += ['-target', self.target]
            script = '#!/bin/sh\nexport ZIG_GLOBAL_CACHE_DIR=' + shlex.quote(str(self.args.zig_cache)) + '\n'
            script += 'export ZIG_LOCAL_CACHE_DIR=' + shlex.quote(str(self.cache / 'zig-local-cache')) + '\n'
            script += 'exec ' + shlex.join(command) + ' "$@"\n'
            path = self.bin / ('ydpen-' + name)
            path.write_text(script)
            path.chmod(0o755)

    def prepare(self):
        self.wrappers()
        # Remaining SDK preparation is deliberately separate from network fetching.
        self.prepare_sdk()

    def prepare_sdk(self):
        include = self.sysroot / 'include'
        lib = self.sysroot / 'lib'
        pc = lib / 'pkgconfig'
        for directory in (include, pc):
            directory.mkdir(parents=True, exist_ok=True)
        doom = PROJECT.parent / 'doom_port/third_party'
        shutil.copytree(doom / 'alsa/alsa', include / 'alsa', dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns('._*'))
        shutil.copytree(doom / 'wayland/include', include, dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns('._*'))
        wayland = self.src / 'wayland'
        for header in ('cursor/wayland-cursor.h', 'egl/wayland-egl.h', 'egl/wayland-egl-core.h'):
            shutil.copyfile(wayland / header, include / Path(header).name)
        shutil.copytree(self.src / 'xkbcommon/include/xkbcommon', include / 'xkbcommon',
                        dirs_exist_ok=True, ignore=shutil.ignore_patterns('._*'))
        # SDL includes matching Khronos EGL/GLES headers, no host Mesa SDK needed.
        for directory in ('EGL', 'GLES2', 'GLES3', 'KHR'):
            shutil.copytree(self.src / 'sdl/src/video/khronos' / directory, include / directory,
                            dirs_exist_ok=True, ignore=shutil.ignore_patterns('._*'))
        libraries = {
            'asound': ('libasound.so.2.0.0', 'libasound.so.2', '1.2.8'),
            'wayland-client': ('libwayland-client.so.0.21.0', 'libwayland-client.so.0', '1.21.0'),
            'wayland-cursor': ('libwayland-cursor.so.0.21.0', 'libwayland-cursor.so.0', '1.21.0'),
            'wayland-egl': ('libwayland-egl.so.1', 'libwayland-egl.so.1', '18.1.0'),
            'xkbcommon': ('libxkbcommon.so.0.0.0', 'libxkbcommon.so.0', '1.5.0'),
            'EGL': ('libEGL.so.1', 'libEGL.so.1', '1.5'),
            'GLESv2': ('libGLESv2.so.2', 'libGLESv2.so.2', '3.2'),
        }
        runtime_manifest = {}
        for name, (filename, soname, version) in libraries.items():
            destination = lib / filename
            if not destination.exists():
                if (doom / 'lib' / filename).is_file():
                    shutil.copyfile(doom / 'lib' / filename, destination)
                else:
                    run(['adb', '-s' + self.args.device, 'pull', '/usr/lib/' + filename, destination])
            validate_elf(destination)
            runtime_manifest[filename] = {'sha256': digest(destination), 'device': self.args.device,
                                          'source': '/usr/lib/' + filename}
            for alias in (soname, 'lib' + name + '.so'):
                alias_path = lib / alias
                if alias != filename and not alias_path.exists():
                    alias_path.symlink_to(filename)
            pcname = {'asound': 'alsa', 'EGL': 'egl', 'GLESv2': 'glesv2'}.get(name, name)
            (pc / (pcname + '.pc')).write_text(
                'prefix=' + str(self.sysroot) + '\nlibdir=${prefix}/lib\nincludedir=${prefix}/include\n'
                'Name: ' + pcname + '\nDescription: Device ABI SDK overlay\nVersion: ' + version +
                '\nLibs: -L${libdir} -l' + name + '\nCflags: -I${includedir}\n')
        (self.cache / 'runtime.lock.json').write_text(json.dumps(runtime_manifest, indent=2) + '\n')
        # Native scanner only: link macOS SDK expat, never target libraries.
        scanner = self.bin / 'wayland-scanner'
        if not scanner.exists():
            sdk = subprocess.check_output(['xcrun', '--show-sdk-path'], text=True).strip()
            run(['clang', '-O2', '-DHAVE_STRNDUP=1', '-DHAVE_LIBXML=0', '-D_GNU_SOURCE',
                 '-isysroot', sdk, '-I' + str(include), '-I' + str(wayland / 'src'),
                 '-I' + sdk + '/usr/include/ffi', wayland / 'src/scanner.c',
                 wayland / 'src/wayland-util.c', '-lexpat', '-o', scanner])
        run([scanner, '--version'])

    def cmake_build(self, name, options=(), source=None):
        build = self.build / name
        cmd = [self.args.cmake, '-S', source or self.src / name, '-B', build, '-G', 'Ninja',
               '-DCMAKE_TOOLCHAIN_FILE=' + str(PROJECT / 'cmake/ydpen.cmake'),
               '-DCMAKE_BUILD_TYPE=Release', '-DCMAKE_INSTALL_PREFIX=' + str(self.prefix),
               '-DCMAKE_INSTALL_LIBDIR=lib', '-DBUILD_SHARED_LIBS=OFF',
               '-DBUILD_TESTING=OFF'] + list(options)
        run(cmd, env=self.env)
        run([self.args.cmake, '--build', build, '--parallel', self.args.jobs], env=self.env)
        run([self.args.cmake, '--install', build], env=self.env)

    def deps(self):
        self.wrappers()
        recipes = {
            'zlib': ['-DZLIB_BUILD_EXAMPLES=OFF'],
            'png': ['-DPNG_SHARED=OFF', '-DPNG_STATIC=ON', '-DPNG_TESTS=OFF',
                    '-DPNG_EXECUTABLES=OFF', '-DZLIB_LIBRARY=' + str(self.prefix / 'lib/libz.a')],
            'jpeg': ['-DENABLE_SHARED=OFF', '-DENABLE_STATIC=ON', '-DWITH_TURBOJPEG=OFF'],
            'ogg': [],
            'vorbis': [],
            'sdl': sdl_options(),
            'mixer': ['-DSDLMIXER_VENDORED=OFF', '-DSDLMIXER_DEPS_SHARED=OFF',
                      '-DSDLMIXER_TESTS=OFF', '-DSDLMIXER_EXAMPLES=OFF',
                      '-DSDLMIXER_AIFF=OFF', '-DSDLMIXER_VOC=OFF', '-DSDLMIXER_FLAC=OFF',
                      '-DSDLMIXER_GME=OFF', '-DSDLMIXER_MOD=OFF', '-DSDLMIXER_MIDI=OFF',
                      '-DSDLMIXER_OPUS=OFF', '-DSDLMIXER_WAVPACK=OFF',
                      '-DSDLMIXER_MP3_MPG123=OFF', '-DSDLMIXER_MP3_DRMP3=ON',
                      '-DSDLMIXER_VORBIS_STB=OFF', '-DSDLMIXER_VORBIS_VORBISFILE=ON',
                      '-DSDLMIXER_VORBIS_TREMOR=OFF'],
        }
        selected = self.args.only or list(recipes) + ['openmpt']
        for name in selected:
            if name == 'openmpt':
                self.build_openmpt()
            elif name in recipes:
                self.cmake_build(name, recipes[name])
            else:
                raise ValueError('Unknown dependency: ' + name)

    def build_openmpt(self):
        source = self.src / 'openmpt'
        recipe = (source / 'Makefile').read_text()
        for marker in ('-DMPT_WITH_MINIMP3', '-DMPT_WITH_STBVORBIS', 'include/miniz/miniz.c'):
            if marker not in recipe:
                raise ValueError('Pinned OpenMPT embedded codec recipe changed: ' + marker)
        options = openmpt_options() + [
            'CC=' + str(self.bin / 'ydpen-cc'), 'CXX=' + str(self.bin / 'ydpen-c++'),
            'LD=' + str(self.bin / 'ydpen-c++'), 'AR=' + str(self.bin / 'ydpen-ar'),
            'PREFIX=' + str(self.prefix)]
        run(['make', '-C', source, '-j' + str(self.args.jobs)] + options, env=self.env)
        run(['make', '-C', source] + options + ['install'], env=self.env)
        print('MO3 support retained: embedded minimp3 + stb_vorbis + miniz', flush=True)

    def game(self):
        build = self.build / 'game'
        # exFAT AppleDouble (._*) files are matched by file(GLOB) as sources and
        # fail to compile; purge them before configuring so the glob stays clean.
        for root, _dirs, files in os.walk(self.args.source):
            for name in files:
                if name.startswith('._'):
                    os.remove(os.path.join(root, name))
        run([self.args.cmake, '-S', self.args.source, '-B', build, '-G', 'Ninja',
             '-DCMAKE_TOOLCHAIN_FILE=' + str(PROJECT / 'cmake/ydpen.cmake'),
             '-DCMAKE_BUILD_TYPE=Release', '-DBUILD_STATIC=ON', '-DLOW_MEMORY=ON',
             '-DPVZ_DEBUG=OFF'], env=self.env)
        run([self.args.cmake, '--build', build, '--parallel', self.args.jobs], env=self.env)
        validate_elf(build / 'pvz-portable')
        print('Cross-built (not executed): ' + str(build / 'pvz-portable'))

    def verify(self):
        self.wrappers()
        source = self.build / 'format-smoke.cpp'
        source.write_text('#include <format>\n#include <thread>\n#include <string>\n'
                          'int main(){std::string s; std::thread t([&]{s=std::format("{}",42);});'
                          't.join();return s=="42"?0:1;}\n')
        output = self.build / 'format-smoke'
        run([self.bin / 'ydpen-c++', '-std=c++20', '-O2', '-pthread', source, '-o', output], env=self.env)
        validate_elf(output)
        run(['file', output])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=DEFAULT_CACHE)
    parser.add_argument('--source', type=Path, default=PROJECT / 'third_party/portable')
    parser.add_argument('--zig', type=Path, default=DEFAULT_ZIG)
    parser.add_argument('--zig-cache', type=Path, default=Path('/Volumes/500GB/qoder_cache/zig-cache'))
    parser.add_argument('--cmake', type=Path, default=Path('/Volumes/500GB/qoder_cache/pvz_build/venv/bin/cmake'))
    parser.add_argument('--target', default=TARGET)
    parser.add_argument('--only', nargs='+', choices=list(SOURCES), help='Build selected dependencies (prerequisites must exist)')
    parser.add_argument('--jobs', type=int, default=4)
    parser.add_argument('--device', default='9DA2200007506350', help='Read-only adb pull source for SDK libraries')
    for action in ('fetch', 'prepare', 'deps', 'game', 'verify'):
        parser.add_argument('--' + action, action='store_true')
    args = parser.parse_args()
    if args.jobs < 1:
        parser.error('--jobs must be positive')
    builder = Builder(args)
    actions = [a for a in ('fetch', 'prepare', 'deps', 'game', 'verify') if getattr(args, a)]
    if not actions:
        parser.error('Specify --fetch, --prepare, --deps, --game and/or --verify')
    for action in actions:
        getattr(builder, action)()


if __name__ == '__main__':
    main()
