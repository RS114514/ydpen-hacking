# -*- coding: utf-8 -*-
"""校验 data/free_events.json 的结构与内容约束。

用法：python3 data/check_free_events.py
退出码 0 表示全部通过，非 0 表示存在错误。
"""
import glob
import json
import os
import sys
from collections import Counter, OrderedDict

BASE = os.path.dirname(os.path.abspath(__file__))
EVENTS_PATH = os.path.join(BASE, "free_events.json")

KINDS = {"investigate", "talk", "move", "wait", "risk"}
EFFECT_KEYS = {"truth", "beauty", "bond", "energy"}
RISKS = {"none", "fail_chance"}
PER_CHAPTER = 3
LABEL_MAX = 12
RESULT_MAX = 60
FAIL_MAX = 40

errors = []
warnings = []


def err(eid, msg):
    errors.append("%s: %s" % (eid, msg))


def load_chapters():
    """从四卷章节数据里收集合法 chapterId。"""
    chapters = OrderedDict()
    for path in sorted(glob.glob(os.path.join(BASE, "script_vol*.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, ValueError) as exc:
            errors.append("%s: 无法读取章节数据（%s）" % (os.path.basename(path), exc))
            continue
        for ch in data.get("chapters", []):
            cid = ch.get("id")
            if cid:
                chapters[cid] = ch.get("title", "")
    return chapters


def main():
    chapters = load_chapters()
    if not chapters:
        print("错误：没有读到任何章节数据（data/script_vol*.json）")
        return 1

    try:
        with open(EVENTS_PATH, encoding="utf-8") as f:
            doc = json.load(f)
    except OSError as exc:
        print("错误：无法打开 %s（%s）" % (EVENTS_PATH, exc))
        return 1
    except ValueError as exc:
        print("错误：free_events.json 不是合法 JSON（%s）" % exc)
        return 1

    if not isinstance(doc, dict) or not isinstance(doc.get("events"), list):
        print("错误：顶层必须是对象，且包含数组字段 events")
        return 1

    events = doc["events"]
    if not events:
        print("错误：events 为空")
        return 1

    seen_ids = set()
    seen_labels = set()
    by_chapter = Counter()
    by_kind = Counter()

    for idx, ev in enumerate(events):
        if not isinstance(ev, dict):
            err("#%d" % idx, "事件必须是对象")
            continue
        eid = ev.get("id")
        if not isinstance(eid, str) or not eid:
            err("#%d" % idx, "缺少字符串 id")
            eid = "#%d" % idx
        if eid in seen_ids:
            err(eid, "id 重复")
        seen_ids.add(eid)

        # chapterId
        cid = ev.get("chapterId")
        if cid not in chapters:
            err(eid, "chapterId 不存在于四卷章节：%r" % (cid,))
        else:
            by_chapter[cid] += 1

        # kind
        kind = ev.get("kind")
        if kind not in KINDS:
            err(eid, "kind 非法：%r（允许 %s）" % (kind, sorted(KINDS)))
        else:
            by_kind[kind] += 1

        # label
        label = ev.get("label")
        if not isinstance(label, str) or not label.strip():
            err(eid, "label 必须是非空字符串")
        else:
            if len(label) > LABEL_MAX:
                err(eid, "label 超过 %d 字（%d：%s）" % (LABEL_MAX, len(label), label))

        # place
        place = ev.get("place")
        if not isinstance(place, str) or not place.strip():
            err(eid, "place 必须是非空字符串")

        # cost
        cost = ev.get("cost")
        if not isinstance(cost, int) or isinstance(cost, bool):
            err(eid, "cost 必须是整数：%r" % (cost,))
        elif not 1 <= cost <= 4:
            err(eid, "cost 超出 1-4：%d" % cost)

        # require
        req = ev.get("require")
        if not isinstance(req, dict):
            err(eid, "require 必须是对象（可为 {}）")
        else:
            extra = set(req) - {"clues", "stat"}
            if extra:
                err(eid, "require 出现未知键：%s" % sorted(extra))
            if "clues" in req:
                clues = req["clues"]
                if not isinstance(clues, int) or isinstance(clues, bool):
                    err(eid, "require.clues 必须是整数：%r" % (clues,))
                elif clues < 0:
                    err(eid, "require.clues 不能为负：%d" % clues)
            if "stat" in req:
                stat = req["stat"]
                if not isinstance(stat, dict):
                    err(eid, "require.stat 必须是对象")
                else:
                    bad = set(stat) - {"truth", "beauty", "bond"}
                    if bad:
                        err(eid, "require.stat 出现未知键：%s" % sorted(bad))
                    for k, v in stat.items():
                        if not isinstance(v, int) or isinstance(v, bool) or v < 0:
                            err(eid, "require.stat.%s 必须是非负整数：%r" % (k, v))

        # result
        result = ev.get("result")
        if not isinstance(result, str) or not result.strip():
            err(eid, "result 必须是非空字符串")
        else:
            if len(result) > RESULT_MAX:
                err(eid, "result 超过 %d 字（%d）" % (RESULT_MAX, len(result)))
            if len(result) < 12:
                warnings.append("%s: result 偏短（%d 字）" % (eid, len(result)))

        # effects
        eff = ev.get("effects")
        if not isinstance(eff, dict):
            err(eid, "effects 必须是对象")
        else:
            keys = set(eff)
            if keys - EFFECT_KEYS:
                err(eid, "effects 出现非法键：%s" % sorted(keys - EFFECT_KEYS))
            missing = EFFECT_KEYS - keys
            if missing:
                err(eid, "effects 缺少键：%s" % sorted(missing))
            for k, v in eff.items():
                if not isinstance(v, int) or isinstance(v, bool):
                    err(eid, "effects.%s 必须是整数：%r" % (k, v))

        # flags
        flags = ev.get("flags")
        if not isinstance(flags, list):
            err(eid, "flags 必须是数组")
        else:
            for fl in flags:
                if not isinstance(fl, str) or not fl.strip():
                    err(eid, "flags 内必须是非空字符串：%r" % (fl,))
            dup = {x for x in flags if flags.count(x) > 1}
            if dup:
                err(eid, "flags 内重复：%s" % sorted(dup))

        # risk / failResult
        risk = ev.get("risk")
        fail = ev.get("failResult")
        if risk not in RISKS:
            err(eid, "risk 非法：%r（允许 none / fail_chance）" % (risk,))
        if not isinstance(fail, str):
            err(eid, "failResult 必须是字符串（无失败写空串）")
        elif risk == "fail_chance":
            if not fail.strip():
                err(eid, "risk=fail_chance 但 failResult 为空")
            elif len(fail) > FAIL_MAX:
                err(eid, "failResult 超过 %d 字（%d）" % (FAIL_MAX, len(fail)))
        elif risk == "none" and fail.strip():
            err(eid, "risk=none 但 failResult 非空")

        # 标签唯一性（同一章内）
        key = (cid, label)
        if key in seen_labels:
            err(eid, "同一章内 label 重复：%s" % label)
        seen_labels.add(key)

    # 每章恰好 3 条
    for cid in chapters:
        n = by_chapter.get(cid, 0)
        if n != PER_CHAPTER:
            err(cid, "事件数为 %d，应为 %d" % (n, PER_CHAPTER))
    for cid in by_chapter:
        if cid not in chapters:
            err(cid, "存在不在章节表中的 chapterId")

    # 覆盖度
    if len(by_kind) < 4:
        err("全局", "kind 覆盖不足，仅 %s" % dict(by_kind))

    # 输出
    print("=" * 52)
    print("自由行动事件表校验")
    print("=" * 52)
    print("事件总数        : %d" % len(events))
    print("覆盖章节        : %d / %d" % (len(by_chapter), len(chapters)))
    print("每章事件数      : %s" % ("全部为 3" if all(
        by_chapter.get(c, 0) == PER_CHAPTER for c in chapters) else "存在异常"))
    print("kind 分布       : %s" % dict(sorted(by_kind.items())))
    print("risk 分布       : %s" % dict(sorted(Counter(
        e.get("risk") for e in events if isinstance(e, dict)).items())))
    print("带 flag 的事件   : %d" % sum(
        1 for e in events if isinstance(e, dict) and e.get("flags")))
    print("总精力消耗      : %d" % sum(
        e.get("cost", 0) for e in events if isinstance(e, dict) and isinstance(e.get("cost"), int)))
    print("-" * 52)

    if warnings:
        print("提示（不影响退出码）：")
        for w in warnings:
            print("  - %s" % w)
        print("-" * 52)

    if errors:
        print("发现 %d 处错误：" % len(errors))
        for e in errors:
            print("  ! %s" % e)
        print("-" * 52)
        print("结果：失败")
        return 1

    print("结果：通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
