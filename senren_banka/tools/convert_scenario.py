#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""convert_scenario.py —— 《千恋＊万花》官方剧本、后日谈与流程图拓扑转换工具

功能：
1. 提取官方 6 个后日谈剧本并生成 app/data/after_*.js
2. 提取整合第 1~3 章完整官方剧本并生成 app/data/chapter_all.js 及 chapter_1/2/3.js
3. 提取原版流程图分支拓扑并生成 app/data/flowchart_data.js
"""

import os
import sys
import json
import re

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(HERE)
DATA_DIR = os.path.join(PROJECT_DIR, "app", "data")
DECOM_DIR = "/tmp/senren_decompiled_json"
RES_DIR = "/Volumes/500GB/千恋万花_移植资源库"

os.makedirs(DATA_DIR, exist_ok=True)

SPEAKER_MAP = {
    '運転手': '司机',
    'ムラサメ': '丛雨',
    'レナ': '蕾娜',
    'みづは': '美津叶',
    '比奈実': '比奈实',
    '一豊': '一丰',
    '忠興': '忠兴',
    '芦花の母親': '芦花的母亲',
    '芦花の父親': '芦花的父亲',
    '黒服Ａ': '黑衣人Ａ',
    '黒服Ｂ': '黑衣人Ｂ',
    '外国人の観光客Ａ': '外国旅客人Ａ',
    '外国人の観光客Ｂ': '外国旅客人Ｂ',
    '外国人の観光客Ｃ': '外国旅客人Ｃ',
    '女子学生Ｃ': '女学生Ｃ',
    '女子学生Ｄ': '女学生Ｄ',
    '女子学生Ｅ': '女学生Ｅ',
    '女子学生Ｆ': '女学生Ｆ',
    '男子学生Ｅ': '男学生Ｅ',
    '男子学生Ｆ': '男学生Ｆ',
    '母Ａ': '母亲Ａ',
    '子猫': '小猫',
    'オッサン': '大叔',
    'オヤジ': '老爹',
    '女性': '芦花',
    '芦花姐': '芦花',
    '芦花姉': '芦花',
    '都子': '都子',
    '母亲・都子': '都子',
    '母・都子': '都子',
}

HEROINES = ['芳乃', '茉子', 'ムラサメ', '丛雨', 'レナ', '蕾娜', '小春', '芦花']

# 官方选择支精确翻译表
OPTION_CN_MAP = {
    '正直に言う': '说实话',
    '誤魔化す': '敷衍过去',
    '都会の方かな': '还是觉得城市好',
    'どうだろ？': '不好说',
    '可愛いと思う': '我觉得很可爱',
    '変じゃないよ': '看着不奇怪',
    '釣り': '钓鱼',
    '山菜': '挖野菜',
    '単独行動': '单独行动',
    'やっぱダメ': '不行',
    'そういうことなら……': '好吧',
    '言葉でお礼を言う': '用语言感谢',
    '頭を撫でてあげる': '摸头',
    'ちょっと心配だ……': '有点担心',
    '小春の言葉を信じる': '相信小春',
    '朝武さんを安心させる': '让她放心',
    '変なことは言わない方がいいか': '少说两句',
    '小春の笑顔': '小春的笑容',
    '芦花姉の笑顔': '芦花姐的笑容',
    '破く！': '撕开！',
    '破かない！': '不撕！',
    '中出しだ！': '中出！',
    'ぶっかけだ！': '射她一身！',
}


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
        
        # 角色名称清洗：如果 candidate 是 ch_effect 等内部名，从立绘文件名推导
        c_name = candidate
        if 'effect' in c_name.lower() or not c_name:
            if file_name:
                stem = file_name.split('.')[0]
                c_name = stem
        c_name = SPEAKER_MAP.get(c_name, c_name)

        last_char_state = {
            'char': c_name,
            'file': file_name,
            'dress': opts.get('dress', ''),
            'face': opts.get('face', '')
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
            last_char_state = {
                'char': prev_name,
                'file': '',
                'dress': '',
                'face': ''
            }
            return last_char_state, last_char_state

    return last_char_state, last_char_state


def process_scene_file(json_path, default_heroine=None, initial_bg="画面_黒", initial_bgm="bgm01.opus", start_id=0):
    with open(json_path, 'r', encoding='utf-8') as f:
        d = json.load(f)

    cur_bg = initial_bg
    cur_bgm = initial_bgm
    last_char_state = None

    rows = []
    line_id = start_id
    current_chapter = None
    labels_map = {}

    for s in d['scenes']:
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


def generate_after_stories():
    print("[1/3] 提取 6 个官方后日谈剧本...")
    configs = [
        ("after_yoshino", "115・芳乃－ａｆｔｅｒver1.01.ks.json", "芳乃", "芳乃后日谈"),
        ("after_mako", "211・茉子－ａｆｔｅｒver1.00.ks.json", "茉子", "茉子后日谈"),
        ("after_murasame", "317・ムラサメちゃんおまけルートver1.2.ks.json", "丛雨", "丛雨后日谈"),
        ("after_rena", "429レナ・いらっしゃい.ks.json", "蕾娜", "蕾娜后日谈"),
        ("after_koharu", "513・サブ－小春（ａｆｔｅｒ）ver1.00.ks.json", "小春", "小春后日谈"),
        ("after_roka", "523・サブ－芦花（ａｆｔｅｒ）ver1.00.ks.json", "芦花", "芦花后日谈"),
    ]

    results = {}
    for var_name, fname, heroine, desc in configs:
        json_path = os.path.join(DECOM_DIR, fname)
        rows, _, _, _, _ = process_scene_file(
            json_path,
            default_heroine=heroine,
            initial_bg="画面_黒",
            initial_bgm="bgm01.opus",
            start_id=0
        )
        arr = []
        for r in rows:
            arr.append([r['id'], r['speaker'], r['text'], r['voice'], r['bg'], r['bgm'], r['charInfo']])

        out_path = os.path.join(DATA_DIR, f"{var_name}.js")
        content = (
            f"// {var_name}.js —— 官方《千恋＊万花》{desc} 完整 {len(arr)} 句台词\n"
            f"// 每行数据格式：[id, speaker, text, voice, bg, bgm, charInfo]\n"
            f"export var {var_name} = {json.dumps(arr, ensure_ascii=False)};\n"
            f"export default {var_name};\n"
        )

        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)

        results[var_name] = (out_path, len(arr))
        print(f"  -> 生成 {var_name}.js: {len(arr)} 行台词")

    return results


def generate_chapters_1_to_3():
    print("[2/3] 提取整合第 1 章至第 3 章完整官方剧本...")
    chapter_files = [
        ("001・アーサー王ver1.07.ks.json", "CHAPTER 1-1", "芳乃"),
        ("002・祟り神ver1.08.ks.json", "CHAPTER 1-2", "芳乃"),
        ("003・巫女の秘密ver1.11.ks.json", "CHAPTER 1-3", "芳乃"),
        ("004・学院初日ver1.04.ks.json", "CHAPTER 2-1", "茉子"),
        ("005・鍛錬ver1.04.ks.json", "CHAPTER 2-3", "茉子"),
        ("006・レナ登場ver1.03.ks.json", "CHAPTER 2-5", "蕾娜"),
        ("007・レナ転入ver1.03.ks.json", "CHAPTER 2-6", "蕾娜"),
        ("008・仕切り直しver1.02.ks.json", "CHAPTER 2-7", "茉子"),
        ("009・謎の欠片ver1.03.ks.json", "CHAPTER 3-1", "丛雨"),
        ("010・リフレッシュver1.04.ks.json", "CHAPTER 3-2", "丛雨"),
        ("011・襲来ver1.04.ks.json", "CHAPTER 3-3", "丛雨"),
        ("012・病床ver1.06.ks.json", "CHAPTER 3-4", "小春"),
        ("013・欠片集めver1.06.ks.json", "CHAPTER 3-5", "茉子"),
        ("014・合体編ver1.03.ks.json", "CHAPTER 3-6", "芳乃"),
        ("015・ノーマルendver1.01.ks.json", "CHAPTER 3-7", "芳乃"),
    ]

    all_rows = []
    chapters_dict = {}
    chapter_index = []
    global_label_map = {}
    
    cur_bg = "画面_黒"
    cur_bgm = "bgm01.opus"
    global_id = 0

    for fname, fallback_chap, heroine in chapter_files:
        json_path = os.path.join(DECOM_DIR, fname)
        ks_stem = fname.replace(".json", "")
        rows, cur_bg, cur_bgm, global_id, file_labels = process_scene_file(
            json_path,
            default_heroine=heroine,
            initial_bg=cur_bg,
            initial_bgm=cur_bgm,
            start_id=global_id
        )

        for lbl, l_id in file_labels.items():
            global_label_map[f"{ks_stem}:{lbl}"] = l_id

        for r in rows:
            if not r['chapter']:
                r['chapter'] = fallback_chap
            ch = r['chapter']
            if ch not in chapters_dict:
                chapters_dict[ch] = []
            
            row_tuple = [r['id'], r['speaker'], r['text'], r['voice'], r['bg'], r['bgm'], r['charInfo'], r['chapter']]
            chapters_dict[ch].append(row_tuple)
            all_rows.append(row_tuple)

    # 建立章节索引表
    cur_idx = 0
    for ch_name, ch_rows in chapters_dict.items():
        chapter_index.append({
            "id": ch_name,
            "title": ch_name,
            "start": cur_idx,
            "count": len(ch_rows),
            "end": cur_idx + len(ch_rows)
        })
        cur_idx += len(ch_rows)

    # 输出完整 chapter_all.js
    out_all_path = os.path.join(DATA_DIR, "chapter_all.js")
    content_all = (
        f"// chapter_all.js —— 官方《千恋＊万花》第 1~3 章完整剧本 ({len(all_rows)} 句台词)\n"
        f"// 章节严格遵循原版编号（CHAPTER 1-1 ~ CHAPTER 3-7），绝无自拟脑补\n"
        f"// 每行数据格式：[id, speaker, text, voice, bg, bgm, charInfo, chapter]\n"
        f"export var chapter_all = {json.dumps(all_rows, ensure_ascii=False)};\n"
        f"export var chapter_index = {json.dumps(chapter_index, ensure_ascii=False, indent=2)};\n"
        f"export var chapters = {json.dumps(chapters_dict, ensure_ascii=False)};\n"
        f"export default chapter_all;\n"
    )
    with open(out_all_path, "w", encoding="utf-8") as f:
        f.write(content_all)
    print(f"  -> 生成 chapter_all.js: 共 {len(all_rows)} 句台词，覆盖 {len(chapters_dict)} 个官方小节")

    # 分卷输出：chapter_1.js, chapter_2.js, chapter_3.js
    vol_specs = [
        ("chapter_1", ["CHAPTER 1-1", "CHAPTER 1-2", "CHAPTER 1-3"]),
        ("chapter_2", ["CHAPTER 2-1", "CHAPTER 2-2", "CHAPTER 2-3", "CHAPTER 2-4", "CHAPTER 2-5", "CHAPTER 2-6", "CHAPTER 2-7"]),
        ("chapter_3", ["CHAPTER 3-1", "CHAPTER 3-2", "CHAPTER 3-3", "CHAPTER 3-4", "CHAPTER 3-5", "CHAPTER 3-6", "CHAPTER 3-7"]),
    ]

    vol_results = {}
    for vol_name, chap_list in vol_specs:
        vol_rows = []
        for ch in chap_list:
            if ch in chapters_dict:
                vol_rows.extend(chapters_dict[ch])
        vol_path = os.path.join(DATA_DIR, f"{vol_name}.js")
        vol_content = (
            f"// {vol_name}.js —— 官方《千恋＊万花》{vol_name.upper()} 完整 {len(vol_rows)} 句台词\n"
            f"// 章节范围：{', '.join(chap_list)}\n"
            f"export var {vol_name} = {json.dumps(vol_rows, ensure_ascii=False)};\n"
            f"export default {vol_name};\n"
        )
        with open(vol_path, "w", encoding="utf-8") as f:
            f.write(vol_content)
        vol_results[vol_name] = (vol_path, len(vol_rows))
        print(f"  -> 生成 {vol_name}.js: {len(vol_rows)} 句台词 ({', '.join(chap_list)})")

    return out_all_path, len(all_rows), vol_results, global_label_map, chapter_index


def parse_scnchart(global_label_map, chapter_index):
    print("[3/3] 解析原版流程图与拓扑结构...")
    tjs_path = os.path.join(RES_DIR, "assets_ready", "system", "main", "scnchartdata.tjs")
    ini_path = os.path.join(RES_DIR, "assets_ready", "system", "main", "flow_texts_cn.ini")

    with open(ini_path, "r", encoding="utf-16le") as f:
        flow_raw = f.read()

    translations = {}
    for line in flow_raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("\t") if p.strip()]
        if len(parts) >= 2:
            translations[parts[0]] = parts[1]

    with open(tjs_path, "r", encoding="utf-16le") as f:
        text = f.read()

    s = re.sub(r'\(const\)', '', text)
    s = re.sub(r'//[^\n]*', '', s)
    s = re.sub(r'\bvoid\b', 'null', s)
    s = re.sub(r'%\[', '{', s)
    s = re.sub(r'=>', ':', s)

    chars = list(s)
    stack = []
    for i, c in enumerate(chars):
        if c == '{': stack.append((i, '{'))
        elif c == '[': stack.append((i, '['))
        elif c == ']':
            if stack:
                open_idx, open_char = stack.pop()
                if open_char == '{': chars[i] = '}'
                elif open_char == '[': chars[i] = ']'

    s2 = ''.join(chars)
    s2 = re.sub(r',\s*([}\]])', r'\1', s2).lstrip('\ufeff \r\n\t')
    chart_data = json.loads(s2)

    captions = chart_data.get('captions', {})
    chain = chart_data.get('chain', {})
    flags_cfg = chart_data.get('flags', {})
    routes = chart_data.get('routes', [])
    raw_items = chart_data.get('items', [])

    def norm_chapter(raw_title):
        if not raw_title: return ""
        m = re.search(r'CHAPTER\s*(\d+-\d+)', raw_title, re.I)
        if m: return f"CHAPTER {m.group(1).upper()}"
        m2 = re.search(r'CHAPTER\s*(\d+)', raw_title, re.I)
        if m2: return f"CHAPTER {m2.group(1).upper()}"
        if "エピローグ" in raw_title or "EPILOGUE" in raw_title.upper() or "尾声" in raw_title:
            return "EPILOGUE"
        if "後日談" in raw_title or "AFTER" in raw_title.upper() or "后日谈" in raw_title:
            return "AFTER"
        if "ＥＮＤ" in raw_title or "END" in raw_title.upper():
            return "END"
        return ""

    chap_start_lookup = {item['id']: item['start'] for item in chapter_index}

    nodes_list = []
    choices_list = []

    for r_idx, r_name in enumerate(routes):
        items_in_route = raw_items[r_idx]
        cur_chapter_code = ""

        for item in items_in_route:
            nid = item.get('id')
            ntype = item.get('type')
            storage = item.get('storage')
            target = item.get('target')
            raw_comment = item.get('comment') or item.get('name') or ""
            translated_comment = translations.get(raw_comment, raw_comment)

            cap_info = captions.get(nid, [])
            cap_text = cap_info[0] if cap_info else ""
            if cap_text in translations:
                cap_text = translations[cap_text]
            
            chap_code = norm_chapter(cap_text)
            if chap_code:
                cur_chapter_code = chap_code

            # 行号查找
            target_line = None
            if storage and target:
                key = f"{storage}:{target}"
                if key in global_label_map:
                    target_line = global_label_map[key]
            if target_line is None and cur_chapter_code in chap_start_lookup:
                target_line = chap_start_lookup[cur_chapter_code]

            node_obj = {
                "id": nid,
                "type": ntype,
                "route": r_name,
                "chapter": cur_chapter_code,
                "title": translated_comment or cap_text or nid,
                "storage": storage,
                "target": target,
                "targetLine": target_line,
                "next": chain.get(nid)
            }
            nodes_list.append(node_obj)

            # 选择支提取
            if ntype == "select" and "selects" in item:
                raw_sels = item.get('selects', [])
                options = []
                for i in range(0, len(raw_sels), 2):
                    opt_raw_text = raw_sels[i]
                    opt_val = raw_sels[i+1]
                    opt_cn_text = OPTION_CN_MAP.get(opt_raw_text) or translations.get(opt_raw_text, opt_raw_text)

                    # 分支跳转目标
                    target_branch = None
                    for ch_key, ch_val in chain.items():
                        if ch_key.startswith(f"{nid}:") and isinstance(ch_val, list) and len(ch_val) >= 2:
                            if ch_val[0] == "select" and ch_val[1] == opt_val:
                                target_branch = ch_key.split(":", 1)[1]
                                break

                    # 好感度增益
                    flag_gain = None
                    for f_key, f_list in flags_cfg.items():
                        for f_entry in f_list:
                            if f_entry[0] == nid and f_entry[1] == opt_val:
                                flag_gain = {
                                    "flag": f_key,
                                    "points": f_entry[2]
                                }

                    options.append({
                        "index": opt_val,
                        "text": opt_cn_text,
                        "targetNode": target_branch,
                        "flagGain": flag_gain
                    })

                # prompt 提示词
                prompt_text = translations.get(nid, "")
                if not prompt_text and cap_info:
                    raw_prompt = cap_info[0]
                    prompt_text = translations.get(raw_prompt, raw_prompt)

                choices_list.append({
                    "id": nid,
                    "chapter": cur_chapter_code,
                    "route": r_name,
                    "prompt": prompt_text,
                    "options": options,
                    "storage": storage,
                    "target": target,
                    "targetLine": target_line
                })

    branches = [
        {"route": "芳乃", "condition": "yos == 1", "desc": "芳乃线判定：朝武芳乃好感度满足"},
        {"route": "蕾娜", "condition": "len == 2", "desc": "蕾娜线判定：蕾娜好感度达到 2 点"},
        {"route": "茉子", "condition": "mak == 2", "desc": "茉子线判定：常陆茉子好感度达到 2 点"},
        {"route": "丛雨", "condition": "mur == 2", "desc": "丛雨线判定：丛雨好感度达到 2 点"},
        {"route": "小春/芦花 (支线)", "condition": "sub == 1", "desc": "支线判定：选择进入鞍马小春或马场芦花分支"},
        {"route": "普通结局 (NORMAL END)", "condition": "else", "desc": "未进入任何角色线路时的结局"}
    ]

    flowchart_full = {
        "routes": routes,
        "nodes": nodes_list,
        "choices": choices_list,
        "branches": branches,
        "flags": flags_cfg,
        "chain": chain
    }

    out_flow_path = os.path.join(DATA_DIR, "flowchart_data.js")
    content_flow = (
        f"// flowchart_data.js —— 官方《千恋＊万花》流程图完整拓扑结构\n"
        f"// 包含 {len(nodes_list)} 个全图节点、{len(choices_list)} 个核心选择支、分支走向与女主线解锁条件\n"
        f"export var flowchart_data = {json.dumps(flowchart_full, ensure_ascii=False, indent=2)};\n"
        f"export var routes = {json.dumps(routes, ensure_ascii=False)};\n"
        f"export var choices = {json.dumps(choices_list, ensure_ascii=False, indent=2)};\n"
        f"export var branches = {json.dumps(branches, ensure_ascii=False, indent=2)};\n"
        f"export default flowchart_data;\n"
    )
    with open(out_flow_path, "w", encoding="utf-8") as f:
        f.write(content_flow)

    print(f"  -> 生成 flowchart_data.js: {len(nodes_list)} 个节点，{len(choices_list)} 个选择支，6 条女主分支条件")
    return out_flow_path, len(nodes_list), len(choices_list)


if __name__ == "__main__":
    after_res = generate_after_stories()
    chap_res = generate_chapters_1_to_3()
    flow_res = parse_scnchart(chap_res[3], chap_res[4])
    print("\n[+] 全部官方剧本与逻辑拓扑数据提取完成！")
