#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""add_side_chains.py —— 为第一/四卷补三环连环委托与单环小委托（幂等，按 id 覆盖）

第一卷：支线委托·博文馆铁柜暗锁寻秘（一 ch04 / 二 ch06 / 三 ch08）
第四卷：支线委托·白马湖老舵手水阻测算法（一 ch29 / 二 ch30 / 三 ch35）

重复运行只会覆盖同 id 条目，不会产生重复数据。
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))

V1 = os.path.join(HERE, 'script_vol1_autumn.json')
V4 = os.path.join(HERE, 'script_vol4_summer.json')


def L(speaker, text):
    return {'speaker': speaker, 'text': text}


def quest(qid, name, place, lines, clue_id, clue_name, clue_desc, effects, chain=None, ring=None):
    q = {'id': qid, 'name': name, 'place': place, 'lines': lines,
         'clue': {'id': clue_id, 'name': clue_name, 'desc': clue_desc},
         'effects': effects}
    if chain:
        q['chain'] = chain
        q['ring'] = ring
    return q


# ── 第一卷 · 博文馆铁柜暗锁寻秘（三环）──
V1_CHAIN = '博文馆铁柜暗锁寻秘'

V1_CH04 = quest(
    'sq_v1_04', '支线委托·' + V1_CHAIN + '·一', '博文馆二楼东首',
    [
        L('', '老铁柜底部夹板松了半寸，柜门仍锁着：外挂锁、抽屉暗扣、柜底簧片，三层。'),
        L('我', '手电照进夹层，深处卡着一包桐油黄纸，够不着。'),
        L('池雨曦', '先别撬。拓锁孔，量匙距。'),
        L('', '铅笔在薄纸上拓出锁孔，三个齿距，一寸二分。'),
        L('管理员', '这柜 1924 年进馆，钥匙早不知去向。'),
    ],
    'C_SQ1_04', '博文馆第一环',
    '铁柜三层锁：外挂、暗扣、柜底簧片；匙距一寸二分，已拓样留档。',
    {'truth': 2}, V1_CHAIN, 1)

V1_CH06 = quest(
    'chain_v1_c2', '支线委托·' + V1_CHAIN + '·二', '仰山楼阁楼钟架',
    [
        L('', '钟架横梁内侧挂着一串旧钥匙，铜绿结成了壳。'),
        L('我', '柄上缠着布条，布条上有墨字。'),
        L('池雨曦', '别解。先看字。'),
        L('', '墨迹褪成褐色：博文·第三柜。'),
        L('管理员', '钥匙有了，柜还开不了。少一片簧。'),
    ],
    'C_SQ1_06', '博文馆第二环',
    '钟架旧钥匙，布条墨书“博文·第三柜”；尚缺柜底簧片。',
    {'truth': 2, 'beauty': 1}, V1_CHAIN, 2)

V1_CH08 = quest(
    'chain_v1_c3', '支线委托·' + V1_CHAIN + '·三', '一字楼夹层',
    [
        L('池雨曦', '夹层木匣里有片薄铜，弯成月牙。'),
        L('我', '是簧片的形状。'),
        L('', '铜片插进柜底，暗扣“嗒”一声弹开。'),
        L('管理员', '只登记，不带走。'),
        L('', '黄纸包打开：夏丏尊油印的修辞学讲义，纸边还留着批注。'),
    ],
    'C_SQ1_08', '博文馆第三环',
    '一字楼夹层铜簧片开柜；柜内为夏丏尊油印《修辞学讲义》样本，登记不外借。',
    {'truth': 3, 'beauty': 3}, V1_CHAIN, 3)

# ── 第一卷 · 单环小委托 ──
V1_CH07 = quest(
    'sq_v1_07', '支线委托·抄一页 1934 年的道具单', '大礼堂后台',
    [
        L('道具老师', '这张单子字太小，抄一份清楚的。'),
        L('我', '照原样抄？'),
        L('道具老师', '照原样。别改错字。'),
        L('', '单子上写着：铁皮一张、黄豆半升、洋烛六支。'),
        L('池雨曦', '黄豆是拿来滚雷声的。'),
    ],
    'C_SQ1_07', '1934 道具单',
    '铁皮、黄豆、洋烛——1934 年《雷雨》的雷声是这么做的；错字照抄不改。',
    {'truth': 1, 'beauty': 1})

V1_CH10 = quest(
    'sq_v1_10', '支线委托·校庆前夜给椅子编号', '大礼堂观众席',
    [
        L('老师', '椅子按双号贴，单号留过道。'),
        L('我', '最后一排呢？'),
        L('老师', '少贴两把，留给站着的人。'),
        L('', '编号贴到第九排，最后两把椅子空着。'),
        L('池雨曦', '空着也是安排。'),
    ],
    'C_SQ1_10', '空着的两把椅子',
    '校庆观众席双号贴签、单号留道；末排空两把，留给站着的人。',
    {'beauty': 1, 'bond': 1})

# ── 第四卷 · 白马湖老舵手水阻测算法（三环）──
V4_CHAIN = '白马湖老舵手水阻测算法'

V4_CH29 = quest(
    'chain_v4_c1', '支线委托·' + V4_CHAIN + '·一', '白马湖赛艇码头',
    [
        L('陈伯', '桨别急着快。先看水。'),
        L('我', '看什么？'),
        L('陈伯', '看浪头碎不碎。碎，就是顶风。'),
        L('', '竹竿探底，一米八才触到泥；风从东边来，浪尖发白。'),
        L('池雨曦', '风、浪、水深，都记下来。'),
    ],
    'C_SQ4_29', '水阻第一环',
    '老舵手看浪判风：浪头碎即顶风；码头水深一米八，东风。',
    {'body': 2, 'truth': 1}, V4_CHAIN, 1)

V4_CH30 = quest(
    'chain_v4_c2', '支线委托·' + V4_CHAIN + '·二', '仰山新楼物理实验室',
    [
        L('我', '把陈伯的话换成数。'),
        L('池雨曦', '阻力跟速度平方走。'),
        L('', '白板上写：F ∝ v²。桨频翻一倍，阻力四倍。'),
        L('我', '所以不是越快越好。'),
        L('池雨曦', '是节奏对才好。'),
    ],
    'C_SQ4_30', '水阻第二环',
    '水阻 F ∝ v²：桨频翻倍，阻力四倍。节奏优于蛮力。',
    {'truth': 2}, V4_CHAIN, 2)

V4_CH35 = quest(
    'chain_v4_c3', '支线委托·' + V4_CHAIN + '·三', '白马湖夏夜栈桥',
    [
        L('陈伯', '今晚还是东风。'),
        L('池雨曦', '按公式，压桨频，拉长滑行。'),
        L('', '夜航一趟，秒表停在四分十二。'),
        L('陈伯', '比昨天快八秒。'),
        L('池雨曦', '湖不认公式，认节奏。'),
    ],
    'C_SQ4_35', '水阻第三环',
    '东风夜航压桨频，四分十二，比昨日快八秒——经验与算式对上了。',
    {'body': 2, 'truth': 2}, V4_CHAIN, 3)

# ── 第四卷 · 单环小委托 ──
V4_CH36 = quest(
    'sq_v4_36', '支线委托·把信投进木箱', '大礼堂前厅',
    [
        L('老师', '成人礼每人一封，写给三年后的自己。'),
        L('我', '写给谁？'),
        L('老师', '写给那天站在这里的你。'),
        L('', '信投进木箱，箱盖合上，锁扣扣好。'),
        L('池雨曦', '我不写。到那天我再说。'),
    ],
    'C_SQ4_36', '三年后的信',
    '成人礼的信投进木箱；池雨曦不写，留到那天当面说。',
    {'beauty': 2, 'bond': 2})


def upsert(volume, chapter_id, item):
    for ch in volume['chapters']:
        if ch['id'] == chapter_id:
            invs = ch.setdefault('investigations', [])
            for i, old in enumerate(invs):
                if old.get('id') == item['id']:
                    invs[i] = item
                    return 'updated'
            invs.append(item)
            return 'added'
    raise SystemExit('chapter not found: ' + chapter_id)


def main():
    v1 = json.load(open(V1, encoding='utf-8'))
    v4 = json.load(open(V4, encoding='utf-8'))
    ops = []
    for cid, item in [('ch04', V1_CH04), ('ch06', V1_CH06), ('ch08', V1_CH08),
                      ('ch07', V1_CH07), ('ch10', V1_CH10)]:
        ops.append(('vol1', cid, item['name'], upsert(v1, cid, item)))
    for cid, item in [('ch29', V4_CH29), ('ch30', V4_CH30), ('ch35', V4_CH35),
                      ('ch36', V4_CH36)]:
        ops.append(('vol4', cid, item['name'], upsert(v4, cid, item)))

    for path, data in [(V1, v1), (V4, v4)]:
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')

    for o in ops:
        print('%s %s %-28s %s' % o)
    print('done')


if __name__ == '__main__':
    main()
