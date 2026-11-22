#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_bg_map.py —— 校验 game.js 背景映射与四卷章节 / 实际图片资产是否一一对得上

用法：python3 data/check_bg_map.py
退出码 0 表示无缺陷；1 表示存在缺失键、缺图或未使用资产。
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GAME_JS = os.path.join(ROOT, 'huiguang_rixin_app', 'app', 'pages', 'game', 'game.js')
IMG_DIR = os.path.join(ROOT, 'huiguang_rixin_app', 'assets', 'images')
FILES = [
    ('vol1_autumn', 'script_vol1_autumn.json'),
    ('vol2_winter', 'script_vol2_winter.json'),
    ('vol3_spring', 'script_vol3_spring.json'),
    ('vol4_summer', 'script_vol4_summer.json'),
]

PAIR = re.compile(r'"([^"]+)"\s*:\s*IMG\s*\+\s*"([^"]+)"')


def parse_map(src, var_name):
    m = re.search(r'var %s = \{(.*?)\n\};' % var_name, src, re.S)
    if not m:
        return {}
    return dict(PAIR.findall(m.group(1)))


def main():
    src = open(GAME_JS, encoding='utf-8').read()
    bg_map = parse_map(src, 'BG_IMAGE_MAP')
    chap_map = parse_map(src, 'CHAPTER_BG_MAP')
    vol_map = parse_map(src, 'VOLUME_DEFAULT_BG')

    assets = set(os.listdir(IMG_DIR)) if os.path.isdir(IMG_DIR) else set()
    problems, used = [], set()

    print('== 映射规模 ==')
    print('BG_IMAGE_MAP %d 键 / CHAPTER_BG_MAP %d 键 / VOLUME_DEFAULT_BG %d 键 / 资产 %d 张'
          % (len(bg_map), len(chap_map), len(vol_map), len(assets)))

    total = 0
    for vol, fn in FILES:
        data = json.load(open(os.path.join(HERE, fn), encoding='utf-8'))
        print('\n== %s · %s ==' % (vol, data.get('title', '')[:28]))
        for ch in data.get('chapters', []):
            total += 1
            bg = ch.get('bg', '')
            if ch['id'] in chap_map:
                img, src_kind = chap_map[ch['id']], 'CHAPTER_BG_MAP'
            elif bg in bg_map:
                img, src_kind = bg_map[bg], 'BG_IMAGE_MAP'
            else:
                img, src_kind = vol_map.get(vol, ''), 'VOLUME_DEFAULT'
                problems.append('%s %s bg=%s 未登记，走分卷兜底' % (vol, ch['id'], bg))
            used.add(img)
            ok = img in assets
            if not ok:
                problems.append('%s %s -> %s 文件不存在' % (vol, ch['id'], img))
            print('  %s %-26s %-24s %s %s' % (ch['id'], bg[:26], img, src_kind, 'OK' if ok else 'MISSING'))

    cards = sorted(a for a in assets if a.startswith('card_'))
    unused = [c for c in cards if c not in used]
    print('\n== 卡片使用情况 ==')
    print('12 张卡片已用 %d 张；未用：%s' % (len(cards) - len(unused), '、'.join(unused) or '无'))

    print('\n== 结论 ==')
    print('章节总数 %d；缺陷 %d 项' % (total, len(problems)))
    for p in problems:
        print('  ! ' + p)
    return 0 if not problems and not unused else 1


if __name__ == '__main__':
    sys.exit(main())
