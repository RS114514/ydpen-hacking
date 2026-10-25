#!/usr/bin/env python3
"""Audit and optionally synchronize scenario voice files over adb."""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = Path("/Volumes/500GB/千恋万花_移植资源库/assets_ready/audio/voice/voice/")
DEFAULT_SERIAL = "9DA2200007506350"
DEFAULT_REMOTE_DIR = "/userdisk/SenrenBanka/voice/"
DEFAULT_REPORT = Path("/Volumes/500GB/qoder_cache/senren_banka/voice_sync_report.json")
ANNOUNCEMENT_NAMES = [
    "yoshino_after.ogg",
    "mako_after.ogg",
    "murasame_after.ogg",
    "lena_after.ogg",
    "koharu_after.ogg",
    "roka_after.ogg",
]
VOICE_REFERENCE = re.compile(r'["\']([^"\']+\.ogg)["\']', re.IGNORECASE)
LS_LINE = re.compile(
    r"^[bcdlps-][rwxStTs-]{9}\+?\s+\d+\s+\S+\s+\S+\s+(\d+)\s+"
    r"(?:\d{4}-\d{2}-\d{2}|[A-Za-z]{3}\s+\d{1,2})\s+\d{2}:\d{2}\s+(.+)$"
)


class VoiceSyncError(RuntimeError):
    pass


class SourceMissingError(VoiceSyncError):
    pass


class FinalVerificationError(VoiceSyncError):
    pass


def collect_voice_names(data_dir):
    data_dir = Path(data_dir)
    chapter = data_dir / "chapter_all.js"
    after_files = sorted(data_dir.glob("after_*.js"))
    if not chapter.is_file():
        raise ValueError("Missing scenario file: %s" % chapter)
    if len(after_files) != 6:
        raise ValueError(
            "Expected exactly 6 after_*.js files, found %d" % len(after_files)
        )

    names = []
    seen = set()
    for scenario in [chapter] + after_files:
        text = scenario.read_text(encoding="utf-8")
        for match in VOICE_REFERENCE.finditer(text):
            reference = match.group(1)
            if reference.startswith("._"):
                continue
            basename = PurePosixPath(reference).name
            if (
                basename != reference
                or "\\" in reference
                or reference in (".", "..")
                or "\x00" in reference
            ):
                raise ValueError(
                    "Voice reference must be a safe basename: %r in %s"
                    % (reference, scenario)
                )
            if basename not in seen:
                seen.add(basename)
                names.append(basename)
    return names


def parse_remote_ls(output):
    sizes = {}
    for line in output.splitlines():
        match = LS_LINE.match(line.strip())
        if not match:
            continue
        name = match.group(2)
        if PurePosixPath(name).name != name or name.startswith("._"):
            continue
        sizes[name] = int(match.group(1))
    return sizes


def _run_adb(runner, args):
    result = runner(args)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip()
        raise VoiceSyncError("adb command failed: %s" % detail)
    return result.stdout or ""


def _remote_sizes(runner, serial, remote_dir):
    output = _run_adb(
        runner, ["adb", "-s", serial, "shell", "ls", "-l", remote_dir]
    )
    return parse_remote_ls(output)


def _file_rows(names, source_sizes, remote_sizes, category):
    rows = []
    for name in names:
        source_size = source_sizes[name]
        device_size = remote_sizes.get(name)
        if device_size is None:
            status = "missing"
        elif device_size != source_size:
            status = "size_mismatch"
        else:
            status = "ok"
        rows.append(
            {
                "name": name,
                "category": category,
                "source_size": source_size,
                "device_size": device_size,
                "status": status,
            }
        )
    return rows


def _summary(names, source_sizes, initial_sizes, final_sizes, category, pushed_names):
    rows = _file_rows(names, source_sizes, final_sizes, category)
    initial_rows = _file_rows(names, source_sizes, initial_sizes, category)
    pushed = sum(name in pushed_names for name in names)
    return {
        "referenced": len(names),
        "source_missing": 0,
        "initial_matched": sum(row["status"] == "ok" for row in initial_rows),
        "initial_missing": sum(row["status"] == "missing" for row in initial_rows),
        "initial_size_mismatch": sum(
            row["status"] == "size_mismatch" for row in initial_rows
        ),
        "pending": sum(row["status"] != "ok" for row in initial_rows),
        "pushed": pushed,
        "verified": sum(row["status"] == "ok" for row in rows),
        "final_missing": sum(row["status"] == "missing" for row in rows),
        "final_size_mismatch": sum(
            row["status"] == "size_mismatch" for row in rows
        ),
    }


def _make_report(
    scenario_names,
    announcement_names,
    source_sizes,
    initial_sizes,
    final_sizes,
    apply,
    pushed_names,
):
    names = scenario_names + announcement_names
    scenario = _summary(
        scenario_names,
        source_sizes,
        initial_sizes,
        final_sizes,
        "scenario",
        pushed_names,
    )
    announcements = _summary(
        announcement_names,
        source_sizes,
        initial_sizes,
        final_sizes,
        "announcement",
        pushed_names,
    )
    total = _summary(
        names, source_sizes, initial_sizes, final_sizes, "total", pushed_names
    )
    summary = dict(total)
    summary.update(
        {"scenario": scenario, "announcements": announcements, "total": total}
    )
    rows = _file_rows(scenario_names, source_sizes, final_sizes, "scenario")
    rows += _file_rows(
        announcement_names, source_sizes, final_sizes, "announcement"
    )
    return {"mode": "apply" if apply else "dry-run", "summary": summary, "files": rows}


def synchronize(
    data_dir,
    source_dir,
    serial,
    remote_dir,
    runner,
    apply=False,
    batch_size=64,
):
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")
    source_dir = Path(source_dir)
    scenario_names = collect_voice_names(data_dir)
    announcement_names = list(ANNOUNCEMENT_NAMES)
    names = scenario_names + announcement_names
    source_sizes = {}
    missing_sources = []
    for name in names:
        source = source_dir / name
        if not source.is_file():
            missing_sources.append(name)
        else:
            source_sizes[name] = source.stat().st_size
    if missing_sources:
        raise SourceMissingError(
            "Missing %d source files; refusing to push: %s"
            % (len(missing_sources), ", ".join(missing_sources[:20]))
        )

    initial_sizes = _remote_sizes(runner, serial, remote_dir)
    pending = [
        name
        for name in names
        if initial_sizes.get(name) != source_sizes[name]
    ]
    if apply:
        destination = remote_dir.rstrip("/") + "/"
        for offset in range(0, len(pending), batch_size):
            batch = pending[offset : offset + batch_size]
            command = ["adb", "-s", serial, "push"]
            command.extend(str(source_dir / name) for name in batch)
            command.append(destination)
            _run_adb(runner, command)
        final_sizes = _remote_sizes(runner, serial, remote_dir)
    else:
        final_sizes = initial_sizes

    pushed_names = pending if apply else []
    report = _make_report(
        scenario_names,
        announcement_names,
        source_sizes,
        initial_sizes,
        final_sizes,
        apply,
        pushed_names,
    )
    if apply and (
        report["summary"]["final_missing"]
        or report["summary"]["final_size_mismatch"]
    ):
        raise FinalVerificationError(
            "Final verification failed: %d missing, %d size mismatches"
            % (
                report["summary"]["final_missing"],
                report["summary"]["final_size_mismatch"],
            )
        )
    return report


def _default_runner(args):
    return subprocess.run(args, text=True, capture_output=True, check=False)


def _print_summary(report):
    summary = report["summary"]
    print("Mode: %s" % report["mode"])
    print("Referenced unique voices: %(referenced)d" % summary)
    for label, key in (
        ("Scenario", "scenario"),
        ("Announcements", "announcements"),
        ("Total", "total"),
    ):
        group = summary[key]
        print(
            "%s referenced/verified/pending: %d/%d/%d"
            % (label, group["referenced"], group["verified"], group["pending"])
        )
    print("Source missing: %(source_missing)d" % summary)
    print(
        "Initially matched/missing/size mismatch: "
        "%(initial_matched)d/%(initial_missing)d/%(initial_size_mismatch)d" % summary
    )
    print("Pending pushes: %(pending)d; pushed: %(pushed)d" % summary)
    print(
        "Final verified/missing/size mismatch: "
        "%(verified)d/%(final_missing)d/%(final_size_mismatch)d" % summary
    )


def build_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=PROJECT_ROOT / "app" / "data")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--serial", default=DEFAULT_SERIAL)
    parser.add_argument("--remote-dir", default=DEFAULT_REMOTE_DIR)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--apply", action="store_true", help="Push pending files; default is audit only")
    parser.add_argument("--batch-size", type=int, default=64)
    return parser


def main(argv=None, runner=None):
    args = build_parser().parse_args(argv)
    runner = runner or _default_runner
    try:
        report = synchronize(
            args.data_dir,
            args.source,
            args.serial,
            args.remote_dir,
            runner,
            apply=args.apply,
            batch_size=args.batch_size,
        )
    except (OSError, ValueError, VoiceSyncError) as exc:
        print("ERROR: %s" % exc, file=sys.stderr)
        return 1

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    _print_summary(report)
    print("JSON report: %s" % args.report)
    if not args.apply and report["summary"]["pending"]:
        print("Dry-run only; rerun with --apply to push pending files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
