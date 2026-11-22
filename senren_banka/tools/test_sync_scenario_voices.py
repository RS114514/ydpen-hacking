import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import sync_scenario_voices as sync


ANNOUNCEMENT_NAMES = [
    "yoshino_after.ogg",
    "mako_after.ogg",
    "murasame_after.ogg",
    "lena_after.ogg",
    "koharu_after.ogg",
    "roka_after.ogg",
]
ROUTE_FILES = [
    "scn_yoshino.js",
    "scn_mako.js",
    "scn_murasame.js",
    "scn_rena.js",
    "scn_koharu.js",
    "scn_roka.js",
]


class FakeAdb:
    def __init__(self, source_dir, remote_sizes=None, complete_pushes=True):
        self.source_dir = Path(source_dir)
        self.remote_sizes = dict(remote_sizes or {})
        self.complete_pushes = complete_pushes
        self.calls = []

    def __call__(self, args):
        self.calls.append(list(args))
        if args[-4:-1] == ["shell", "ls", "-l"]:
            lines = ["* daemon started successfully *"]
            for name, size in sorted(self.remote_sizes.items()):
                lines.append(
                    "-rw-rw---- 1 root root %d 2026-10-25 12:00 %s" % (size, name)
                )
            return subprocess.CompletedProcess(args, 0, "\n".join(lines), "")
        if "push" in args:
            push_at = args.index("push")
            sources = args[push_at + 1 : -1]
            if self.complete_pushes:
                for source in sources:
                    self.remote_sizes[Path(source).name] = Path(source).stat().st_size
            return subprocess.CompletedProcess(args, 0, "", "")
        raise AssertionError("Unexpected adb command: %r" % (args,))

    @property
    def pushes(self):
        return [call for call in self.calls if "push" in call]


class ScenarioParsingTests(unittest.TestCase):
    def test_exactly_chapter_all_and_six_after_files_with_deduplication(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            (data / "chapter_all.js").write_text(
                '["a.ogg", "a.ogg", "b.ogg", "._junk.ogg"]'
            )
            for index in range(6):
                (data / ("after_%d.js" % index)).write_text('["b.ogg", "c%d.ogg"]' % index)
            (data / "chapter_1.js").write_text('["ignored.ogg"]')

            names = sync.collect_voice_names(data)

            self.assertEqual(names, ["a.ogg", "b.ogg"] + ["c%d.ogg" % i for i in range(6)])

    def test_requires_exactly_six_after_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            (data / "chapter_all.js").write_text("")
            for index in range(5):
                (data / ("after_%d.js" % index)).write_text("")
            with self.assertRaisesRegex(ValueError, "exactly 6"):
                sync.collect_voice_names(data)

    def test_rejects_non_basename_voice_references(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            (data / "chapter_all.js").write_text('["../escape.ogg"]')
            for index in range(6):
                (data / ("after_%d.js" % index)).write_text("")
            with self.assertRaisesRegex(ValueError, "basename"):
                sync.collect_voice_names(data)

    def test_collects_all_six_route_files_with_deduplication(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            for route_file in ROUTE_FILES:
                route = route_file.split("_", 1)[1].split(".")[0]
                (data / route_file).write_text(
                    json.dumps(
                        ["%s.ogg" % route, "shared.ogg", "shared.ogg"]
                    )
                )
            (data / "scn_index.js").write_text('["metadata.ogg"]')
            (data / "scn_common.js").write_text('["common.ogg"]')

            names = sync.collect_route_voice_names(data)

            self.assertEqual(
                names,
                [
                    "yoshino.ogg",
                    "shared.ogg",
                    "mako.ogg",
                    "murasame.ogg",
                    "rena.ogg",
                    "koharu.ogg",
                    "roka.ogg",
                ],
            )
            self.assertNotIn("metadata.ogg", names)
            self.assertNotIn("common.ogg", names)

    def test_requires_all_six_route_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            for route_file in ROUTE_FILES[:-1]:
                (data / route_file).write_text("[]")
            with self.assertRaisesRegex(ValueError, "route"):
                sync.collect_route_voice_names(data)

    def test_rejects_unsafe_route_voice_references(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            for route_file in ROUTE_FILES:
                (data / route_file).write_text("[]")
            (data / ROUTE_FILES[0]).write_text('["../escape.ogg"]')
            with self.assertRaisesRegex(ValueError, "basename"):
                sync.collect_route_voice_names(data)


class RemoteParsingTests(unittest.TestCase):
    def test_parses_ls_metadata_and_ignores_daemon_and_appledouble(self):
        output = """* daemon not running; starting now at tcp:5037
* daemon started successfully *
total 2
-rw-rw---- 1 root root 123 2026-10-25 12:00 a.ogg
-rw-rw---- 1 root root 999 2026-10-25 12:00 ._a.ogg
"""
        self.assertEqual(sync.parse_remote_ls(output), {"a.ogg": 123})

    def test_parses_android_month_name_timestamps(self):
        output = "-rwxrwxrwx 1 root root  12761 Oct 24 18:41 gen001_001.ogg"
        self.assertEqual(sync.parse_remote_ls(output), {"gen001_001.ogg": 12761})


class DefaultConfigTests(unittest.TestCase):
    def test_report_defaults_to_external_cache(self):
        args = sync.build_parser().parse_args([])
        self.assertEqual(
            args.report,
            Path("/Volumes/500GB/qoder_cache/senren_banka/voice_sync_report.json"),
        )


class SynchronizationTests(unittest.TestCase):
    def make_scenarios(self, root, names, route_names=None):
        data = root / "data"
        data.mkdir()
        (data / "chapter_all.js").write_text(json.dumps(names))
        for index in range(6):
            (data / ("after_%d.js" % index)).write_text("[]")
        route_names = route_names or {}
        for route_file in ROUTE_FILES:
            (data / route_file).write_text(
                json.dumps(route_names.get(route_file, []))
            )
        return data

    def write_announcement_sources(self, source):
        for index, name in enumerate(ANNOUNCEMENT_NAMES):
            (source / name).write_bytes(bytes([index + 1]) * (index + 10))

    def matching_announcement_sizes(self, source):
        return {
            name: (source / name).stat().st_size for name in ANNOUNCEMENT_NAMES
        }

    def test_missing_source_prevents_every_push(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(root, ["present.ogg", "missing.ogg"])
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            (source / "present.ogg").write_bytes(b"ok")
            adb = FakeAdb(source)

            with self.assertRaises(sync.SourceMissingError):
                sync.synchronize(data, source, "serial", "/voice", adb, apply=True)
            self.assertEqual(adb.pushes, [])

    def test_pushes_only_missing_or_size_mismatched_files_in_batches(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            names = ["same.ogg", "missing.ogg", "wrong.ogg"]
            data = self.make_scenarios(root, names)
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            for index, name in enumerate(names):
                (source / name).write_bytes(bytes([index]) * (index + 2))
            remote_sizes = self.matching_announcement_sizes(source)
            remote_sizes.update(
                {"same.ogg": 2, "wrong.ogg": 99, "unreferenced.ogg": 1}
            )
            adb = FakeAdb(source, remote_sizes)

            report = sync.synchronize(
                data, source, "serial", "/voice", adb, apply=True, batch_size=2
            )

            self.assertEqual(len(adb.pushes), 1)
            pushed = adb.pushes[0]
            push_at = pushed.index("push")
            self.assertEqual(
                [Path(value).name for value in pushed[push_at + 1 : -1]],
                ["missing.ogg", "wrong.ogg"],
            )
            self.assertEqual(pushed[-1], "/voice/")
            self.assertEqual(report["summary"]["pushed"], 2)
            self.assertEqual(report["summary"]["verified"], 9)
            self.assertEqual(report["summary"]["final_missing"], 0)
            self.assertEqual(report["summary"]["final_size_mismatch"], 0)
            self.assertNotIn("unreferenced.ogg", {item["name"] for item in report["files"]})
            scenario_rows = [
                item for item in report["files"] if item.get("category") == "scenario"
            ]
            self.assertEqual(
                [(item["name"], item["source_size"], item["device_size"]) for item in scenario_rows],
                [("same.ogg", 2, 2), ("missing.ogg", 3, 3), ("wrong.ogg", 4, 4)],
            )

    def test_dry_run_never_pushes_and_reports_pending_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(root, ["a.ogg"])
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            (source / "a.ogg").write_bytes(b"abc")
            adb = FakeAdb(source, self.matching_announcement_sizes(source))

            report = sync.synchronize(data, source, "serial", "/voice", adb, apply=False)

            self.assertEqual(adb.pushes, [])
            self.assertEqual(report["summary"]["pending"], 1)
            self.assertEqual(report["summary"]["final_missing"], 1)

    def test_final_verification_failure_is_an_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(root, ["a.ogg"])
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            (source / "a.ogg").write_bytes(b"abc")
            adb = FakeAdb(
                source,
                self.matching_announcement_sizes(source),
                complete_pushes=False,
            )

            with self.assertRaises(sync.FinalVerificationError):
                sync.synchronize(data, source, "serial", "/voice", adb, apply=True)

    def test_pushes_missing_announcement_and_verifies_it(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(root, [])
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            remote_sizes = self.matching_announcement_sizes(source)
            del remote_sizes["mako_after.ogg"]
            adb = FakeAdb(source, remote_sizes)

            report = sync.synchronize(
                data, source, "serial", "/voice", adb, apply=True
            )

            self.assertEqual(len(adb.pushes), 1)
            pushed = adb.pushes[0]
            push_at = pushed.index("push")
            self.assertEqual(
                [Path(value).name for value in pushed[push_at + 1 : -1]],
                ["mako_after.ogg"],
            )
            announcements = report["summary"].get("announcements", {})
            self.assertEqual(announcements.get("initial_missing"), 1)
            self.assertEqual(announcements.get("pushed"), 1)
            self.assertEqual(announcements.get("verified"), 6)
            self.assertEqual(announcements.get("final_missing"), 0)

    def test_pushes_size_mismatched_announcement_and_verifies_it(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(root, [])
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            remote_sizes = self.matching_announcement_sizes(source)
            remote_sizes["roka_after.ogg"] = 999
            adb = FakeAdb(source, remote_sizes)

            report = sync.synchronize(
                data, source, "serial", "/voice", adb, apply=True
            )

            self.assertEqual(len(adb.pushes), 1)
            pushed = adb.pushes[0]
            push_at = pushed.index("push")
            self.assertEqual(
                [Path(value).name for value in pushed[push_at + 1 : -1]],
                ["roka_after.ogg"],
            )
            announcements = report["summary"].get("announcements", {})
            self.assertEqual(announcements.get("initial_size_mismatch"), 1)
            self.assertEqual(announcements.get("pushed"), 1)
            self.assertEqual(announcements.get("verified"), 6)
            self.assertEqual(announcements.get("final_size_mismatch"), 0)

    def test_report_distinguishes_scenario_announcements_and_total(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(root, ["a.ogg"])
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            (source / "a.ogg").write_bytes(b"abc")
            remote_sizes = self.matching_announcement_sizes(source)
            remote_sizes["a.ogg"] = 3
            adb = FakeAdb(source, remote_sizes)

            report = sync.synchronize(
                data, source, "serial", "/voice", adb, apply=False
            )

            summary = report["summary"]
            self.assertEqual(summary.get("scenario", {}).get("referenced"), 1)
            self.assertEqual(summary.get("announcements", {}).get("referenced"), 6)
            self.assertEqual(summary.get("total", {}).get("referenced"), 7)
            self.assertEqual(summary.get("scenario", {}).get("verified"), 1)
            self.assertEqual(summary.get("announcements", {}).get("verified"), 6)
            self.assertEqual(summary.get("total", {}).get("verified"), 7)
            self.assertEqual(summary.get("referenced"), 7)
            self.assertEqual(
                [row.get("category") for row in report["files"]],
                ["scenario"] + ["announcement"] * 6,
            )

    def test_report_distinguishes_scenario_routes_announcements_and_total(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(
                root,
                ["a.ogg"],
                {
                    "scn_yoshino.js": ["a.ogg", "r.ogg", "r.ogg"],
                    "scn_mako.js": ["r.ogg"],
                },
            )
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            for name in ("a.ogg", "r.ogg"):
                (source / name).write_bytes(b"abc")
            remote_sizes = self.matching_announcement_sizes(source)
            remote_sizes.update({"a.ogg": 3, "r.ogg": 3})
            adb = FakeAdb(source, remote_sizes)

            report = sync.synchronize(
                data, source, "serial", "/voice", adb, apply=False
            )

            summary = report["summary"]
            self.assertEqual(summary["scenario"]["referenced"], 1)
            self.assertEqual(summary["routes"]["referenced"], 2)
            self.assertEqual(summary["announcements"]["referenced"], 6)
            self.assertEqual(summary["total"]["referenced"], 9)
            self.assertEqual(summary["referenced"], 9)
            self.assertEqual(summary["unique_referenced"], 8)
            self.assertEqual(summary["duplicate_references"], 1)
            self.assertEqual(summary["source_missing"], 0)
            self.assertEqual(summary["total"]["source_missing"], 0)
            self.assertEqual(
                [row.get("category") for row in report["files"]],
                ["scenario", "route", "route"] + ["announcement"] * 6,
            )

    def test_missing_route_source_is_reported_but_blocks_apply(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(
                root, ["a.ogg"], {"scn_yoshino.js": ["missing_route.ogg"]}
            )
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            (source / "a.ogg").write_bytes(b"abc")
            remote_sizes = self.matching_announcement_sizes(source)
            remote_sizes["a.ogg"] = 3
            adb = FakeAdb(source, remote_sizes)

            report = sync.synchronize(
                data, source, "serial", "/voice", adb, apply=False
            )

            summary = report["summary"]
            self.assertEqual(adb.pushes, [])
            self.assertEqual(summary["source_missing"], 1)
            self.assertEqual(summary["missing_sources"], ["missing_route.ogg"])
            self.assertEqual(summary["routes"]["source_missing"], 1)
            self.assertEqual(
                summary["routes"]["missing_sources"], ["missing_route.ogg"]
            )
            self.assertEqual(summary["pending"], 0)

            blocking_adb = FakeAdb(source, remote_sizes)
            with self.assertRaises(sync.SourceMissingError) as caught:
                sync.synchronize(
                    data, source, "serial", "/voice", blocking_adb, apply=True
                )
            self.assertIn("missing_route.ogg", str(caught.exception))
            self.assertEqual(blocking_adb.pushes, [])
            self.assertEqual(blocking_adb.calls, [])

    def test_main_dry_run_reports_missing_source_and_still_writes_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(
                root, ["a.ogg"], {"scn_roka.js": ["missing_route.ogg"]}
            )
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            (source / "a.ogg").write_bytes(b"abc")
            report_path = root / "report.json"
            remote_sizes = self.matching_announcement_sizes(source)
            remote_sizes["a.ogg"] = 3
            adb = FakeAdb(source, remote_sizes)

            exit_code = sync.main(
                [
                    "--data-dir", str(data),
                    "--source", str(source),
                    "--serial", "serial",
                    "--remote-dir", "/voice",
                    "--report", str(report_path),
                ],
                runner=adb,
            )

            self.assertEqual(exit_code, 0)
            saved = json.loads(report_path.read_text())
            self.assertEqual(saved["summary"]["source_missing"], 1)
            self.assertEqual(
                saved["summary"]["missing_sources"], ["missing_route.ogg"]
            )
            self.assertEqual(
                saved["summary"]["routes"]["missing_sources"],
                ["missing_route.ogg"],
            )

    def test_main_writes_complete_json_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = self.make_scenarios(root, ["a.ogg"])
            source = root / "source"
            source.mkdir()
            self.write_announcement_sources(source)
            (source / "a.ogg").write_bytes(b"abc")
            report_path = root / "nested" / "report.json"
            remote_sizes = self.matching_announcement_sizes(source)
            remote_sizes["a.ogg"] = 3
            adb = FakeAdb(source, remote_sizes)

            exit_code = sync.main(
                [
                    "--data-dir", str(data),
                    "--source", str(source),
                    "--serial", "serial",
                    "--remote-dir", "/voice",
                    "--report", str(report_path),
                ],
                runner=adb,
            )

            self.assertEqual(exit_code, 0)
            saved = json.loads(report_path.read_text())
            self.assertEqual(saved["summary"]["referenced"], 7)
            self.assertEqual(saved["summary"]["verified"], 7)
            self.assertEqual(saved["files"][0]["name"], "a.ogg")
            self.assertEqual(saved["files"][0]["source_size"], 3)
            self.assertEqual(saved["files"][0]["device_size"], 3)


class RealDataCollectionTests(unittest.TestCase):
    def test_real_default_sources_contain_scenario_routes_and_announcements(self):
        data_dir = sync.PROJECT_ROOT / "app" / "data"
        scenario_names = sync.collect_voice_names(data_dir)
        route_names = sync.collect_route_voice_names(data_dir)
        announcement_names = getattr(sync, "ANNOUNCEMENT_NAMES", [])

        self.assertEqual(len(scenario_names), 5589)
        self.assertEqual(len(route_names), 20684)
        self.assertEqual(len(set(route_names)), len(route_names))
        self.assertEqual(
            sync.ROUTE_FILES,
            tuple(ROUTE_FILES),
        )
        self.assertTrue(all((data_dir / name).is_file() for name in ROUTE_FILES))
        self.assertEqual(len(scenario_names) + len(route_names), 26273)
        self.assertEqual(announcement_names, ANNOUNCEMENT_NAMES)
        self.assertFalse(set(scenario_names).intersection(announcement_names))
        self.assertFalse(set(route_names).intersection(announcement_names))
        self.assertEqual(
            len(scenario_names) + len(route_names) + len(announcement_names),
            26279,
        )
        self.assertTrue(
            all((sync.DEFAULT_SOURCE / name).is_file() for name in scenario_names)
        )
        self.assertTrue(
            all((sync.DEFAULT_SOURCE / name).is_file() for name in announcement_names)
        )


if __name__ == "__main__":
    unittest.main()
