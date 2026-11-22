# -*- coding: utf-8 -*-
import json
from build_vol1_part4 import vol1 as rich_vol1

# 1. Enrich script_vol1_autumn.json
v1_path = '/Volumes/500GB/Ydpen/data/script_vol1_autumn.json'
with open(v1_path, 'r', encoding='utf-8') as f:
    v1_cur = json.load(f)

rich_ch_map = {c['id']: c for c in rich_vol1['chapters']}

for ch in v1_cur['chapters']:
    cid = ch['id']
    rc = rich_ch_map.get(cid)
    if not rc:
        continue
    # Metadata
    if not ch.get('summary'):
        ch['summary'] = rc.get('summary', '')
    if not ch.get('bgDesc'):
        ch['bgDesc'] = rc.get('bgDesc', '')
    if not ch.get('unlock'):
        ch['unlock'] = rc.get('unlock', '')
    if not ch.get('caseRef'):
        ch['caseRef'] = rc.get('caseRef', [])
    # Merge lines: prepend rich lines that aren't already in ch['lines']
    existing_texts = set(x.get('text', '') for x in ch.get('lines', []))
    for l in rc.get('lines', []):
        if l['text'] not in existing_texts:
            ch['lines'].append(l)
            existing_texts.add(l['text'])
    # Rebuild flow: include all ch['lines'], existing flow non-duplicate lines, and choiceNodes
    flow_texts = set()
    new_flow = []
    for l in ch['lines']:
        new_flow.append({'type': 'line', 'speaker': l.get('speaker', ''), 'text': l.get('text', '')})
        flow_texts.add(l.get('text', ''))
    for item in ch.get('flow', []):
        if item.get('type') == 'choice':
            new_flow.append(item)
        elif item.get('text', '') not in flow_texts:
            new_flow.append(item)
            flow_texts.add(item.get('text', ''))
    # Ensure every chapter in vol1 has at least 1 choice node in flow
    has_choice = any(x.get('type') == 'choice' for x in new_flow)
    if not has_choice and rc.get('choiceNodes'):
        cn = rc['choiceNodes'][0]
        new_flow.append({
            'type': 'choice',
            'id': cn['id'],
            'prompt': cn['prompt'],
            'options': cn['options']
        })
    ch['flow'] = new_flow
    ch['choiceNodes'] = rc.get('choiceNodes', ch.get('choiceNodes', []))
    # Merge investigations
    inv_ids = set(x.get('id') for x in ch.get('investigations', []))
    for inv in rc.get('investigations', []):
        if inv['id'] not in inv_ids:
            ch.setdefault('investigations', []).append(inv)
            inv_ids.add(inv['id'])
    # Merge codex
    cx_ids = set(x.get('id') for x in ch.get('codex', []))
    for cx in rc.get('codex', []):
        if cx['id'] not in cx_ids:
            ch.setdefault('codex', []).append(cx)
            cx_ids.add(cx['id'])
    # Merge partnerNotes
    pn_ids = set(x.get('id') for x in ch.get('partnerNotes', []))
    for pn in rc.get('partnerNotes', []):
        if pn['id'] not in pn_ids:
            ch.setdefault('partnerNotes', []).append(pn)
            pn_ids.add(pn['id'])
    # Add quiz if missing
    if not ch.get('quiz') and rc.get('quiz'):
        ch['quiz'] = rc['quiz']

with open(v1_path, 'w', encoding='utf-8') as f:
    json.dump(v1_cur, f, ensure_ascii=False, indent=2)

print("Vol 1 enriched successfully.")
