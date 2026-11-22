#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Write app/data/gallery_scenes.js from the 24 original scene definitions.

Variant PNGs are produced by tools/build_scene_gallery.py from the layered
.pimg files; this script only joins metadata with the generated filenames.
"""
import json
import os
import sys

ROOT = '/Volumes/500GB/Ydpen/senren_banka'
MANIFEST = '/Volumes/500GB/qoder_cache/senren_banka/scene_variants_manifest.json'
OUT = os.path.join(ROOT, 'app/data/gallery_scenes.js')

SCENES = [
    # yoshino
    ('yos110', 'yoshino', '芳乃', '110', '初次体验', '110・芳乃－初体験', 'ev112', ['ev112', 'ev111']),
    ('yos112', 'yoshino', '芳乃', '112', '第二次', '112・芳乃－２回目', 'ev113', ['ev113', 'ev114']),
    ('yos113', 'yoshino', '芳乃', '113', '母上大人', '113・芳乃－母上様', 'ev115', ['ev115', 'ev116']),
    ('yos115', 'yoshino', '芳乃', '115', '后日谈', '115・芳乃－ａｆｔｅｒ', 'ev118', ['ev118', 'ev117']),
    # mako
    ('mak206', 'mako', '茉子', '206', '自我安慰', '206・茉子－オナニー', 'ev208', ['ev208']),
    ('mak207', 'mako', '茉子', '207', '初次体验', '207・茉子－初体験', 'ev212', ['ev212', 'ev211']),
    ('mak208', 'mako', '茉子', '208', '甜蜜时光', '208・茉子－いちゃラヴ', 'ev214', ['ev214', 'ev213']),
    ('mak209', 'mako', '茉子', '209', '暴走改编', '209・茉子－暴走改編', 'ev209', ['ev209']),
    ('mak210', 'mako', '茉子', '210', '终章', '210・茉子－エピローグ', 'ev215', ['ev215', 'ev216']),
    ('mak211', 'mako', '茉子', '211', '后日谈', '211・茉子－ａｆｔｅｒ', 'ev218', ['ev218', 'ev217']),
    # murasame
    ('mur306', 'murasame', '丛雨', '306', '路线 06', '306・ムラサメちゃんルート０６', 'ev312', ['ev312', 'ev311']),
    ('mur309', 'murasame', '丛雨', '309', '路线 09', '309・ムラサメちゃんルート０９', 'ev313', ['ev313', 'ev314']),
    ('mur314', 'murasame', '丛雨', '314', '路线 14', '314・ムラサメちゃんルート１４', 'ev315', ['ev315', 'ev316']),
    ('mur317', 'murasame', '丛雨', '317', '番外路线', '317・ムラサメちゃんおまけルート', 'ev318', ['ev318', 'ev317']),
    # rena
    ('ren422', 'rena', '蕾娜', '422', '日常约会', '422・レナ－日常デート', 'ev412', ['ev412', 'ev411']),
    ('ren423', 'rena', '蕾娜', '423', '丛云所生', '423・レナ－叢雲より生じたる', 'ev414', ['ev414', 'ev413']),
    ('ren426', 'rena', '蕾娜', '426', '前夜', '426・レナ－前夜', 'ev415', ['ev415', 'ev416']),
    ('ren429', 'rena', '蕾娜', '429', '欢迎光临', '429・レナ－いらっしゃい', 'ev418', ['ev418', 'ev417']),
    # koharu
    ('koh511', 'koharu', '小春', '511', '初次体验', '511・サブ－小春（初体験）', 'ev504', ['ev504', 'ev503', 'ev502']),
    ('koh512', 'koharu', '小春', '512', '之后', '512・サブ－小春（その後）', 'ev505', ['ev505']),
    ('koh513', 'koharu', '小春', '513', '后日谈', '513・サブ－小春（ａｆｔｅｒ）', 'ev507', ['ev507', 'ev508']),
    # roka
    ('rok521', 'roka', '芦花', '521', '初次体验', '521・サブ－芦花（初体験）', 'ev603', ['ev603', 'ev604']),
    ('rok522', 'roka', '芦花', '522', '之后', '522・サブ－芦花（その後）', 'ev606', ['ev606', 'ev605']),
    ('rok523', 'roka', '芦花', '523', '后日谈', '523・サブ－芦花（ａｆｔｅｒ）', 'ev608', ['ev608', 'ev607']),
]

def main():
    by_group = {}
    if os.path.exists(MANIFEST):
        for item in json.load(open(MANIFEST)):
            if item.get('status') == 'ok':
                by_group[item['group']] = item
    rows = []
    missing = []
    for sid, route, role, code, title, source, cover, cgs in SCENES:
        item = by_group.get(cover)
        variants = []
        if item:
            for out in item.get('outputs', []):
                variants.append(out['file'])
        else:
            missing.append(cover)
        rows.append({
            'id': sid, 'route': route, 'role': role, 'code': code,
            'title': title, 'source': source, 'cover': cover,
            'cgs': cgs, 'variants': variants,
        })
    js = '// gallery_scenes.js — 原版 24 个场景鉴赏（芳乃4 / 茉子6 / 丛雨4 / 蕾娜4 / 小春3 / 芦花3）\n'
    js += 'export var gallery_scenes = ' + json.dumps(rows, ensure_ascii=False, separators=(',', ':')) + ';\n'
    js += 'export default gallery_scenes;\n'
    open(OUT, 'w').write(js)
    print('wrote', OUT, 'scenes', len(rows), 'missing', missing)
    for row in rows:
        print(row['id'], row['cover'], len(row['variants']))

if __name__ == '__main__':
    main()
