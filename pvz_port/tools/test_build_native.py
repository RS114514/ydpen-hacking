import importlib.util
import io
import os
from pathlib import Path
import struct
import tarfile
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('build_native', Path(__file__).with_name('build_native.py'))
build = importlib.util.module_from_spec(SPEC) if SPEC and SPEC.loader and Path(SPEC.origin).exists() else None
if build:
    SPEC.loader.exec_module(build)


class NativeBuildTests(unittest.TestCase):
    def setUp(self):
        self.assertIsNotNone(build, 'build_native.py must implement the cross-build safety checks')

    def test_target_only_accepts_aarch64_linux_glibc_at_most_229(self):
        for target in ('aarch64-linux-gnu.2.29', 'aarch64-linux-gnu.2.28'):
            self.assertEqual(build.validate_target(target), target)
        for target in ('aarch64-linux-gnu.2.30', 'aarch64-linux-gnu', 'aarch64-macos',
                       'x86_64-linux-gnu.2.29', 'aarch64-linux-musl', 'aarch64-linux-gnu.2.29;touch x'):
            with self.assertRaises(ValueError):
                build.validate_target(target)

    def test_rejects_source_overlapping_cache(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            source = root / 'portable'
            source.mkdir()
            for cache in (source, source / 'build', root):
                with self.assertRaises(ValueError):
                    build.validate_paths(source, cache)
            build.validate_paths(source, root / 'cache')

    def archive(self, path, name, kind=None, link=''):
        with tarfile.open(path, 'w') as archive:
            info = tarfile.TarInfo(name)
            if kind:
                info.type, info.linkname = kind, link
                archive.addfile(info)
            else:
                info.size = 2
                archive.addfile(info, io.BytesIO(b'ok'))

    def test_extracts_regular_files(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            self.archive(root / 'a.tar', 'repo/LICENSE')
            build.safe_extract(root / 'a.tar', root / 'out')
            self.assertEqual((root / 'out/repo/LICENSE').read_bytes(), b'ok')

    def test_extracts_internal_framework_symlink(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            self.archive(root / 'a.tar', 'repo/link', tarfile.SYMTYPE, 'target')
            build.safe_extract(root / 'a.tar', root / 'out')
            self.assertEqual(os.readlink(root / 'out/repo/link'), 'target')

    def test_rejects_traversal_absolute_paths_and_links(self):
        for name, kind, link in (('../escape', None, ''), ('/tmp/escape', None, ''),
                                 ('repo/link', tarfile.SYMTYPE, '../../escape'),
                                 ('repo/link', tarfile.LNKTYPE, '/tmp/escape'),
                                 ('repo/device', tarfile.CHRTYPE, '')):
            with self.subTest(name=name, kind=kind), tempfile.TemporaryDirectory() as td:
                root = Path(td)
                self.archive(root / 'a.tar', name, kind, link)
                with self.assertRaises(ValueError):
                    build.safe_extract(root / 'a.tar', root / 'out')

    def test_archive_root_ignores_only_verified_appledouble(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / 'repo').mkdir()
            (root / '._repo').write_bytes(bytes.fromhex('00051607') + b'fake metadata')
            self.assertTrue(hasattr(build, 'archive_root'), 'archive root must handle verified AppleDouble metadata')
            self.assertEqual(build.archive_root(root), root / 'repo')
            (root / '._repo').write_bytes(b'not metadata')
            with self.assertRaises(ValueError):
                build.archive_root(root)

    def test_pkg_config_isolated_from_host(self):
        env = build.cross_environment(Path('/cache/prefix'), Path('/cache/sysroot'),
                                      {'PKG_CONFIG_PATH': '/opt/homebrew/lib/pkgconfig',
                                       'CPATH': '/host/include', 'LIBRARY_PATH': '/host/lib'})
        self.assertEqual(env['PKG_CONFIG_PATH'], '')
        self.assertNotIn('/opt/homebrew', env['PKG_CONFIG_LIBDIR'])
        self.assertNotIn('CPATH', env)
        self.assertNotIn('LIBRARY_PATH', env)
        self.assertIn('/cache/prefix/lib/pkgconfig', env['PKG_CONFIG_LIBDIR'])

    def test_openmpt_keeps_embedded_mo3_codecs(self):
        self.assertTrue(hasattr(build, 'openmpt_options'), 'explicit MO3 codec recipe required')
        options = build.openmpt_options()
        for flag in ('NO_MINIMP3=0', 'NO_STBVORBIS=0', 'NO_MINIZ=0', 'IS_CROSS=1', 'STDCXX=c++20'):
            self.assertIn(flag, options)
        self.assertNotIn('NO_MINIMP3=1', options)
        self.assertNotIn('NO_STBVORBIS=1', options)

    def test_sdl_uses_wayland_alsa_gles_not_desktop_backends(self):
        self.assertTrue(hasattr(build, 'sdl_options'), 'explicit device backend recipe required')
        options = build.sdl_options()
        for flag in ('-DSDL_WAYLAND=ON', '-DSDL_ALSA=ON', '-DSDL_OPENGLES=ON',
                     '-DSDL_X11=OFF', '-DSDL_VULKAN=OFF', '-DSDL_PIPEWIRE=OFF',
                     '-DSDL_PULSEAUDIO=OFF', '-DSDL_DBUS=OFF', '-DSDL_IBUS=OFF', '-DSDL_LIBUDEV=OFF'):
            self.assertIn(flag, options)

    def test_archive_inspection_rejects_host_objects(self):
        self.assertTrue(hasattr(build, 'validate_archive'), 'target archives need real ELF inspection')
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / 'test.a'
            data = bytearray(64)
            data[:6] = b'\x7fELF\x02\x01'
            for machine in (183, 62):
                struct.pack_into('<H', data, 18, machine)
                header = ('test.o/         ' + '0           ' + '0     ' + '0     ' +
                          '100644  ' + str(len(data)).ljust(10) + '`\n').encode()
                path.write_bytes(b'!<arch>\n' + header + data)
                if machine == 183:
                    self.assertEqual(build.validate_archive(path), 1)
                else:
                    with self.assertRaises(ValueError):
                        build.validate_archive(path)

    def test_validates_actual_elf_architecture(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / 'test.o'
            data = bytearray(64)
            data[:6] = b'\x7fELF\x02\x01'
            struct.pack_into('<H', data, 18, 183)
            path.write_bytes(data)
            build.validate_elf(path)
            struct.pack_into('<H', data, 18, 62)
            path.write_bytes(data)
            with self.assertRaises(ValueError):
                build.validate_elf(path)
            path.write_bytes(b'not an ELF')
            with self.assertRaises(ValueError):
                build.validate_elf(path)


if __name__ == '__main__':
    unittest.main()
