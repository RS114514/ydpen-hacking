#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""merge_ngplus.py —— 把子 Agent 起草的二周目文本并入四卷 JSON

读取 data/_ngplus_a.json（ch10/ch36）与 data/_ngplus_b.json（ch20/ch28），
覆盖对应章节的 ngPlusLines；幂等，可重复执行。
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
TARGET = {
    'ch10': 'script_vol1_autumn.json',
    'ch36': 'script_vol4_summer.json',
    'ch20': 'script_vol2_winter.json',
    'ch28': 'script_vol3_spring.json',
}
SRC = ['_ngplus_a.json', '_ngplus_b.json']
MAX = 44


def main():
    frag = {}
    for fn in SRC:
        p = os.path.join(HERE, fn)
        if os.path.exists(p):
            frag.update(json.load(open(p, encoding='utf-8')))

    bad = []
    for cid, lines in frag.items():
        if len(lines) < 8:
            bad.append((cid, '句数不足 %d' % len(lines)))
        for l in lines:
            if l.get('speaker', '') not in ('', '我', '池雨曦'):
                bad.append((cid, '未知发言人 ' + l.get('speaker', '')))
            if len(l.get('text', '')) > MAX:
                bad.append((cid, '超长 %d' % len(l['text'])))
    if bad:
        print('! 校验失败', bad)
        raise SystemExit(1)

    files = {}
    for cid, fn in TARGET.items():
        if cid not in frag:
            continue
        path = os.path.join(HERE, fn)
        data = files.setdefault(path, json.load(open(path, encoding='utf-8')))
        hit = False
        for ch in data['chapters']:
            if ch['id'] == cid:
                ch['ngPlusLines'] = frag[cid]
                hit = True
                print('%s %s <- %d 句' % (fn, cid, len(frag[cid])))
        if not hit:
            print('! %s 未找到章节 %s' % (fn, cid))

    for path, data in files.items():
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
    print('合并完成：%d 章' % len(frag))


if __name__ == '__main__':
    main()
