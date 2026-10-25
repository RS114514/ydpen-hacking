#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""transcode_all_scenarios.py —— 官方全量 92 剧本转码与多路线数据生成工具

将 500GB 硬盘中全量官方《千恋＊万花》剧本完整转码为 7 大路线独立模块：
1. scn_common.js   : 共通线 (001~015, 15 个文件)
2. scn_yoshino.js  : 朝武芳乃主线 (100~115, 16 个文件)
3. scn_mako.js     : 常陆茉子主线 (200~211, 12 个文件)
4. scn_murasame.js : 丛雨主线 (301~317, 17 个文件)
5. scn_rena.js     : 蕾娜主线 (414~429, 16 个文件)
6. scn_koharu.js   : 鞍马小春支线 (501~513, 10 个文件)
7. scn_roka.js     : 马场芦花支线 (521~523, 6 个文件)
以及全局路线总索引：
   scn_index.js
"""

import os
import sys
import json
import re
import glob

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, "app", "data")
DECOM_DIR = "/tmp/senren_decompiled_json"
RES_DIR = "/Volumes/500GB/千恋万花_移植资源库"

os.makedirs(DATA_DIR, exist_ok=True)

SPEAKER_MAP = {
    # 主要角色与常见变体
    '有地将臣': '将臣',
    '将臣': '将臣',
    '朝武芳乃': '芳乃',
    '芳乃': '芳乃',
    '常陸茉子': '茉子',
    '常陆茉子': '茉子',
    '茉子': '茉子',
    'ムラサメ': '丛雨',
    '丛雨': '丛雨',
    'レナ': '蕾娜',
    '蕾娜': '蕾娜',
    '鞍馬小春': '小春',
    '鞍马小春': '小春',
    '小春': '小春',
    '馬場芦花': '芦花',
    '马场芦花': '芦花',
    '芦花': '芦花',
    '芦花姉': '芦花',
    '芦花姐': '芦花',
    '女性': '芦花',
    '鞍馬廉太郎': '廉太郎',
    '鞍马廉太郎': '廉太郎',
    '廉太郎': '廉太郎',
    '鞍馬玄十郎': '玄十郎',
    '鞍马玄十郎': '玄十郎',
    '玄十郎': '玄十郎',
    '祖父・玄十郎': '玄十郎',
    '朝武安晴': '安晴',
    '安晴': '安晴',
    '神官': '安晴',
    '駒子': '驹子',
    '駒子さん': '驹子',
    '心子': '心子',
    '女将': '心子',
    '都子': '都子',
    '母・都子': '都子',
    '母亲・都子': '都子',
    '白川辰之助': '辰之助',
    '辰之助': '辰之助',
    # 配角及路人
    '運転手': '司机',
    'みづは': '美津叶',
    '比奈実': '比奈实',
    '比奈实': '比奈实',
    '一豊': '一丰',
    '忠興': '忠兴',
    '芦花の母親': '芦花的母亲',
    '芦花の父親': '芦花的父亲',
    '黒服Ａ': '黑衣人Ａ',
    '黒服Ｂ': '黑衣人Ｂ',
    '外国人の観光客Ａ': '外国旅客人Ａ',
    '外国人の観光客Ｂ': '外国旅客人Ｂ',
    '外国人の観光客Ｃ': '外国旅客人Ｃ',
    '女子学生Ａ': '女学生Ａ',
    '女子学生Ｂ': '女学生Ｂ',
    '女子学生Ｃ': '女学生Ｃ',
    '女子学生Ｄ': '女学生Ｄ',
    '女子学生Ｅ': '女学生Ｅ',
    '女子学生Ｆ': '女学生Ｆ',
    '男子学生Ａ': '男学生Ａ',
    '男子学生Ｂ': '男学生Ｂ',
    '男子学生Ｃ': '男学生Ｃ',
    '男子学生Ｄ': '男学生Ｄ',
    '男子学生Ｅ': '男学生Ｅ',
    '男子学生Ｆ': '男学生Ｆ',
    '母Ａ': '母亲Ａ',
    '子猫': '小猫',
    'オッサン': '大叔',
    'オヤジ': '老爹',
}

HEROINES = ['芳乃', '茉子', 'ムラサメ', '丛雨', 'レナ', '蕾娜', '小春', '芦花', '玄十郎', '廉太郎']

def get_speaker(t):
    sp_cn = t[2][2][0] if (len(t) > 2 and t[2] and len(t[2]) > 2) else None
    sp0 = t[0]
    if sp0 in SPEAKER_MAP:
        return SPEAKER_MAP[sp0]
    if sp_cn:
        sp_cn = sp_cn.strip()
        if sp_cn in SPEAKER_MAP:
            return SPEAKER_MAP[sp_cn]
        return sp_cn
    if sp0:
        sp0 = sp0.strip()
        return SPEAKER_MAP.get(sp0, sp0)
    return ""

def get_text(t):
    if len(t) > 2 and t[2] and len(t[2]) > 2:
        return t[2][2][1] or ""
    return ""

def get_voice(t):
    if len(t) > 3 and t[3] and len(t[3]) > 0:
        v = t[3][0].get('voice')
        if v:
            if not v.endswith('.ogg') and not v.endswith('.opus'):
                return v + '.ogg'
            return v
    return None

def extract_env(t, cur_bg, cur_bgm):
    data = t[5].get('data', [])
    for item in data:
        if item[0] == 'stage':
            img = item[2].get('redraw', {}).get('imageFile')
            if img and img.get('file'):
                cur_bg = img.get('file')
        elif item[0] == 'bgm':
            b = item[2].get('replay', {}).get('filename')
            if b:
                cur_bgm = b.lower() if b.lower().endswith('.opus') else b.lower() + '.opus'
    return cur_bg, cur_bgm

def extract_char_info(t, default_heroine, last_char_state):
    chars = {x[0]: x for x in t[5].get('data', []) if x[1] == 'character'}
    speaker = get_speaker(t)
    candidate = None

    # 1. 优先当前正在说话且在场上展示的角色
    if speaker in chars and chars[speaker][2].get('showmode') == 3:
        candidate = speaker
    elif default_heroine and default_heroine in chars and chars[default_heroine][2].get('showmode') == 3:
        candidate = default_heroine
    else:
        for h in HEROINES:
            if h in chars and chars[h][2].get('showmode') == 3:
                candidate = h
                break
        if not candidate:
            for name, item in chars.items():
                if item[2].get('showmode') == 3:
                    candidate = name
                    break

    if candidate:
        c_obj = chars[candidate][2]
        img = c_obj.get('redraw', {}).get('imageFile', {})
        opts = img.get('options', {})
        file_name = img.get('file', '')
        
        c_name = candidate
        if 'effect' in c_name.lower() or not c_name:
            if file_name:
                stem = file_name.split('.')[0]
                c_name = stem
        c_name = SPEAKER_MAP.get(c_name, c_name)

        # 规范化 dress 与 face
        dress = opts.get('dress', '')
        face = opts.get('face', '')

        # 如果没有 dress，默认使用私服
        if not dress and file_name:
            dress = '私服'

        last_char_state = {
            'char': c_name,
            'file': file_name,
            'dress': dress,
            'face': face
        }
        return last_char_state, last_char_state

    # 检查是否角色隐藏 (showmode == 0)
    if last_char_state and last_char_state.get('file'):
        prev_name = last_char_state['char']
        raw_names = [prev_name]
        for k, v in SPEAKER_MAP.items():
            if v == prev_name:
                raw_names.append(k)

        should_hide = False
        for rn in raw_names:
            if rn in chars and chars[rn][2].get('showmode') == 0:
                should_hide = True
                break
        if should_hide:
            last_char_state = None
            return None, None

    return last_char_state, last_char_state

def parse_single_scene_json(json_path, default_heroine=None, initial_bg="画面_黒", initial_bgm="bgm01.opus", start_id=0):
    with open(json_path, 'r', encoding='utf-8') as f:
        d = json.load(f)

    cur_bg = initial_bg
    cur_bgm = initial_bgm
    last_char_state = None

    rows = []
    line_id = start_id
    current_chapter = None
    labels_map = {}

    for s in d.get('scenes', []):
        lbl = s.get('label')
        if lbl:
            labels_map[lbl] = line_id
        texts = s.get('texts', [])
        for t in texts:
            speaker = get_speaker(t)
            text = get_text(t)
            voice = get_voice(t)
            cur_bg, cur_bgm = extract_env(t, cur_bg, cur_bgm)
            char_info, last_char_state = extract_char_info(t, default_heroine, last_char_state)

            sd_date = t[5].get('showdate', {}).get('date')
            if sd_date:
                current_chapter = f"CHAPTER {sd_date.upper()}"

            rows.append({
                'id': line_id,
                'speaker': speaker,
                'text': text,
                'voice': voice,
                'bg': cur_bg,
                'bgm': cur_bgm,
                'charInfo': char_info,
                'chapter': current_chapter
            })
            line_id += 1

    return rows, cur_bg, cur_bgm, line_id, labels_map

def main():
    print("=== 开始全量 92 官方剧本转码流程 ===")
    
    # 扫描 DECOM_DIR 下所有 json
    json_files = [f for f in os.listdir(DECOM_DIR) if f.endswith('.ks.json') and not f.startswith('._')]
    print(f"检测到反编译 JSON 剧本: {len(json_files)} 个")

    # 定义 7 大路线与对应文件过滤规则
    route_configs = [
        {
            "key": "common",
            "name": "共通线",
            "var_name": "scn_common",
            "out_file": "scn_common.js",
            "filter": lambda f: f.startswith(('00', '01')),
            "heroine": None
        },
        {
            "key": "yoshino",
            "name": "朝武芳乃线",
            "var_name": "scn_yoshino",
            "out_file": "scn_yoshino.js",
            "filter": lambda f: f.startswith('1'),
            "heroine": "芳乃"
        },
        {
            "key": "mako",
            "name": "常陆茉子线",
            "var_name": "scn_mako",
            "out_file": "scn_mako.js",
            "filter": lambda f: f.startswith('2'),
            "heroine": "茉子"
        },
        {
            "key": "murasame",
            "name": "丛雨线",
            "var_name": "scn_murasame",
            "out_file": "scn_murasame.js",
            "filter": lambda f: f.startswith('3'),
            "heroine": "丛雨"
        },
        {
            "key": "rena",
            "name": "蕾娜线",
            "var_name": "scn_rena",
            "out_file": "scn_rena.js",
            "filter": lambda f: f.startswith('4'),
            "heroine": "蕾娜"
        },
        {
            "key": "koharu",
            "name": "鞍马小春线",
            "var_name": "scn_koharu",
            "out_file": "scn_koharu.js",
            "filter": lambda f: f.startswith(('50', '51')),
            "heroine": "小春"
        },
        {
            "key": "roka",
            "name": "马场芦花线",
            "var_name": "scn_roka",
            "out_file": "scn_roka.js",
            "filter": lambda f: f.startswith('52'),
            "heroine": "芦花"
        }
    ]

    total_all_lines = 0
    route_summaries = []

    for cfg in route_configs:
        matching_files = sorted([f for f in json_files if cfg["filter"](f)])
        print(f"\n[{cfg['name']}] 匹配到 {len(matching_files)} 个剧本文件")
        
        route_rows = []
        route_chapters = []
        cur_bg = "画面_黒"
        cur_bgm = "bgm01.opus"
        cur_id = 0

        for idx, fname in enumerate(matching_files):
            jpath = os.path.join(DECOM_DIR, fname)
            clean_stem = fname.replace('.ks.json', '')
            
            rows, cur_bg, cur_bgm, cur_id, labels = parse_single_scene_json(
                jpath,
                default_heroine=cfg["heroine"],
                initial_bg=cur_bg,
                initial_bgm=cur_bgm,
                start_id=cur_id
            )

            # 确定小节标题
            m_code = re.search(r'^(\d+)', clean_stem)
            code_str = m_code.group(1) if m_code else f"{idx+1:03d}"
            
            # 从文件名提取日文名或小节名
            title_part = clean_stem.split('・')[-1] if '・' in clean_stem else clean_stem
            title_part = re.sub(r'ver\d+\.\d+.*', '', title_part)

            chap_entry = {
                "id": code_str,
                "file": fname,
                "title": title_part,
                "start": cur_id - len(rows),
                "count": len(rows),
                "end": cur_id
            }
            route_chapters.append(chap_entry)

            # 补充每行 chapter 标识
            for r in rows:
                if not r['chapter']:
                    r['chapter'] = f"SEC-{code_str}"
                route_rows.append([
                    r['id'],
                    r['speaker'],
                    r['text'],
                    r['voice'],
                    r['bg'],
                    r['bgm'],
                    r['charInfo'],
                    r['chapter']
                ])

        total_all_lines += len(route_rows)
        out_js_path = os.path.join(DATA_DIR, cfg["out_file"])
        
        content = (
            f"// {cfg['out_file']} —— 官方《千恋＊万花》{cfg['name']} 完整全量剧本 ({len(route_rows)} 句台词)\n"
            f"// 涵盖 {len(route_chapters)} 个官方剧本节\n"
            f"export var {cfg['var_name']} = {json.dumps(route_rows, ensure_ascii=False)};\n"
            f"export var {cfg['var_name']}_index = {json.dumps(route_chapters, ensure_ascii=False, indent=2)};\n"
            f"export default {cfg['var_name']};\n"
        )
        with open(out_js_path, "w", encoding="utf-8") as f:
            f.write(content)

        route_summaries.append({
            "key": cfg["key"],
            "name": cfg["name"],
            "filesCount": len(matching_files),
            "linesCount": len(route_rows),
            "chaptersCount": len(route_chapters),
            "outFile": cfg["out_file"]
        })
        print(f"  -> 生成 {cfg['out_file']}: 共 {len(route_rows)} 句台词，覆盖 {len(route_chapters)} 个章节")

    # 生成全局索引 scn_index.js
    index_path = os.path.join(DATA_DIR, "scn_index.js")
    index_content = (
        f"// scn_index.js —— 官方《千恋＊万花》全路线剧本全局索引配置\n"
        f"// 全量 92 剧本总台词量：{total_all_lines} 句\n"
        f"export var routes_summary = {json.dumps(route_summaries, ensure_ascii=False, indent=2)};\n"
        f"export var total_game_lines = {total_all_lines};\n"
        f"export default routes_summary;\n"
    )
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_content)

    print(f"\n[+] 全量转码完成！全部 7 大路线共生成 {total_all_lines} 句台词！")
    print(f"[+] 全局索引已写入: {index_path}")

if __name__ == "__main__":
    main()
