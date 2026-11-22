#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从四卷 JSON 聚合生成 huiguang_rixin_app/app/data/story_data.js 与 script_manifest.json"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FILES = [
    ('vol1_autumn', 'script_vol1_autumn.json'),
    ('vol2_winter', 'script_vol2_winter.json'),
    ('vol3_spring', 'script_vol3_spring.json'),
    ('vol4_summer', 'script_vol4_summer.json'),
]

def load(key, fn):
    return json.load(open(os.path.join(HERE, fn), encoding='utf-8'))

def counts(d):
    ch = d.get('chapters', [])
    ca = d.get('cases', [])
    return {
        'chapterCount': len(ch),
        'caseCount': len(ca),
        'lineCount': sum(len(c.get('lines', [])) for c in ch),
        'flowCount': sum(len(c.get('flow', [])) for c in ch),
        'choiceNodeCount': sum(1 for c in ch for x in c.get('flow', []) if x.get('type') == 'choice'),
        'investigationCount': sum(len(c.get('investigations', [])) for c in ch),
        'investigationLineCount': sum(len(i['lines']) for c in ch for i in c.get('investigations', [])),
        'codexCount': sum(len(c.get('codex', [])) for c in ch),
        'codexLineCount': sum(len(x['lines']) for c in ch for x in c.get('codex', [])),
        'documentCount': sum(len(c.get('documents', [])) for c in ch),
        'documentLineCount': sum(len(x['lines']) for c in ch for x in c.get('documents', [])),
        'quizCount': sum(1 for c in ch if c.get('quiz')),
        'partnerNoteCount': sum(len(c.get('partnerNotes', [])) for c in ch),
        'postscriptCount': sum(1 for c in ch if c.get('postscript')),
        'postscriptLineCount': sum(len(c.get('postscript', [])) for c in ch),
        'caseStageCount': sum(len(ca.get('deduction', {}).get('stages', [])) for ca in ca),
    }

def main():
    vols = {}
    for key, fn in FILES:
        vols[key] = load(key, fn)
    cases = []
    for key, _ in FILES:
        cases.extend(vols[key].get('cases', []))

    manifest = {
        'title': '晖光日新',
        'volumes': [k for k, _ in FILES],
        'total_chapters': sum(len(v.get('chapters', [])) for v in vols.values()),
        'total_cases': len(cases),
        'generated': '2026-11-01',
        'target': 'YDPX6-2 800x220',
        'viewSpec': {'maxLinesPerScreen': 4, 'maxCharsPerLine': 100, 'choicesPerBranch': '2-3', 'maxChoiceChars': 16},
    }
    for key, _ in FILES:
        c = counts(vols[key])
        c['file'] = 'data/' + dict(FILES)[key]
        c['title'] = vols[key].get('title', '')
        c['playableLineCount'] = c['lineCount'] + c['investigationLineCount'] + c['codexLineCount'] + c['documentLineCount'] + c['postscriptLineCount']
        manifest[key] = c

    # 支线委托：把“三环连环委托”从名称里解析出链条与环序（也接受显式 chain/ring 字段）
    NUM = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5}

    def chain_meta(name):
        parts = name.split('·')
        if len(parts) >= 3 and parts[-1] in NUM:
            return '·'.join(parts[1:-1]), NUM[parts[-1]]
        return '', 0

    side_quests = []
    for key, _ in FILES:
        for ch in vols[key].get('chapters', []):
            for inv in ch.get('investigations', []):
                if inv.get('name', '').startswith('支线委托'):
                    chain = inv.get('chain', '')
                    ring = inv.get('ring', 0)
                    if not chain:
                        chain, ring = chain_meta(inv.get('name', ''))
                    side_quests.append({
                        'id': inv.get('id', ''),
                        'volume': key,
                        'chapterId': ch.get('id', ''),
                        'chapterTitle': ch.get('title', ''),
                        'name': inv.get('name', ''),
                        'place': inv.get('place', ''),
                        'chain': chain,
                        'ring': ring,
                        'lines': inv.get('lines', []),
                        'clue': inv.get('clue', {}),
                        'effects': inv.get('effects', {}),
                        'lineCount': len(inv.get('lines', []))
                    })
    chains = {}
    for q in side_quests:
        if q['chain']:
            c = chains.setdefault(q['chain'], {'name': q['chain'], 'volume': q['volume'], 'rings': []})
            c['rings'].append({'ring': q['ring'], 'questId': q['id'], 'chapterId': q['chapterId']})
    side_chains = [chains[k] for k in chains]
    for c in side_chains:
        c['rings'].sort(key=lambda r: r['ring'])
        c['ringCount'] = len(c['rings'])
    manifest['sideQuestCount'] = len(side_quests)
    manifest['sideChainCount'] = len(side_chains)
    payload = {'manifest': manifest, 'volumes': vols, 'cases': cases,
               'sideQuests': side_quests, 'sideChains': side_chains}
    js = '// story_data.js —— 《晖光日新》全四卷 36 章与 24 案卷数据聚合（由 data/build_story_data.py 生成）\n'
    js += 'export var STORY_DATA = ' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n'
    out = os.path.join(ROOT, 'huiguang_rixin_app', 'app', 'data', 'story_data.js')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8', newline='\n').write(js)

    # 同步一份协作清单
    manifest_path = os.path.join(HERE, 'script_manifest.json')
    old = {}
    if os.path.exists(manifest_path):
        old = json.load(open(manifest_path, encoding='utf-8'))
    old['volumes'] = {k: manifest[k] for k, _ in FILES}
    old['totals'] = {
        'deepSeekVolumes': ['vol2_winter', 'vol3_spring'],
        'mainLines': manifest['vol2_winter']['lineCount'] + manifest['vol3_spring']['lineCount'],
        'flowNodes': manifest['vol2_winter']['flowCount'] + manifest['vol3_spring']['flowCount'],
        'choiceNodes': manifest['vol2_winter']['choiceNodeCount'] + manifest['vol3_spring']['choiceNodeCount'],
        'investigationLines': manifest['vol2_winter']['investigationLineCount'] + manifest['vol3_spring']['investigationLineCount'],
        'codexLines': manifest['vol2_winter']['codexLineCount'] + manifest['vol3_spring']['codexLineCount'],
        'documentLines': manifest['vol2_winter']['documentLineCount'] + manifest['vol3_spring']['documentLineCount'],
        'playableLines': manifest['vol2_winter']['playableLineCount'] + manifest['vol3_spring']['playableLineCount'],
        'caseStages': manifest['vol2_winter']['caseStageCount'] + manifest['vol3_spring']['caseStageCount'],
        'quizzes': manifest['vol2_winter']['quizCount'] + manifest['vol3_spring']['quizCount'],
        'investigations': manifest['vol2_winter']['investigationCount'] + manifest['vol3_spring']['investigationCount'],
        'documents': manifest['vol2_winter']['documentCount'] + manifest['vol3_spring']['documentCount'],
        'postscripts': manifest['vol2_winter']['postscriptCount'] + manifest['vol3_spring']['postscriptCount'],
        'postscriptLines': manifest['vol2_winter']['postscriptLineCount'] + manifest['vol3_spring']['postscriptLineCount'],
    }
    json.dump(old, open(manifest_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('written', out, os.path.getsize(out), 'bytes')
    print('totals', json.dumps(old['totals'], ensure_ascii=False))

if __name__ == '__main__':
    main()
