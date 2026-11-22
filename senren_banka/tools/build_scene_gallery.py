#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the 24-scene gallery expression variants from original layered .pimg files.

Each Yuzusoft .pimg is a PSB containing 4-9 poses.  A pose "Aa" is a full
1920x1080 base and "Ab".."Az" are face overlays at their own offsets.  The
original CG ids (ev112aa..ev112ai) are exactly those composites, so this
script reproduces them at the device's 944x532 CG size.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import threading
from concurrent.futures import ThreadPoolExecutor

ROOT = '/Volumes/500GB'
CACHE = os.path.join(ROOT, 'qoder_cache/senren_banka')
WORK = os.path.join(CACHE, 'scene_work')
OUT = os.path.join(CACHE, 'scene_variants')
MONO = shutil.which('mono') or '/opt/homebrew/bin/mono'
DECOMPILER = '/Volumes/500GB/Ydpen/senren_banka/tools/FreeMote/PsbDecompile.exe'
FONT = '/Volumes/500GB/千恋万花_移植资源库'
PIMG_DIRS = [
    os.path.join(FONT, 'assets_ready/other'),
    os.path.join(FONT, 'assets_ready/cg/evimage'),
    '/Volumes/500GB/G/千恋万花Senren Banka Steam Edition/unencrypted',
]

SCENE_GROUPS = [
    # yoshino
    ('ev112', 'yos110'), ('ev113', 'yos112'), ('ev115', 'yos113'), ('ev118', 'yos115'),
    # mako
    ('ev208', 'mak206'), ('ev212', 'mak207'), ('ev214', 'mak208'), ('ev209', 'mak209'),
    ('ev215', 'mak210'), ('ev218', 'mak211'),
    # murasame
    ('ev312', 'mur306'), ('ev313', 'mur309'), ('ev315', 'mur314'), ('ev318', 'mur317'),
    # rena
    ('ev412', 'ren422'), ('ev414', 'ren423'), ('ev415', 'ren426'), ('ev418', 'ren429'),
    # koharu
    ('ev504', 'koh511'), ('ev505', 'koh512'), ('ev507', 'koh513'),
    # roka
    ('ev603', 'rok521'), ('ev606', 'rok522'), ('ev608', 'rok523'),
]

PRINT_LOCK = threading.Lock()


def log(msg):
    with PRINT_LOCK:
        print(msg, flush=True)


def find_pimg(group):
    names = [group + 'a.pimg', group + '_a.pimg']
    for d in PIMG_DIRS:
        for name in names:
            p = os.path.join(d, name)
            if os.path.exists(p):
                return p
    return None


def layer_expr(name):
    m = re.match(r'^([A-Z])([a-z])$', name)
    return (m.group(1), m.group(2)) if m else None


def choose_pose(layers, width, height):
    poses = {}
    for layer in layers:
        parsed = layer_expr(layer.get('name', ''))
        if not parsed:
            continue
        pose, expr = parsed
        poses.setdefault(pose, {})[expr] = layer
    best = None
    for pose in sorted(poses):
        base = poses[pose].get('a')
        if not base or base.get('width') != width or base.get('height') != height:
            continue
        faces = [e for e in poses[pose] if e != 'a']
        score = (pose == 'A', len(faces), -ord(pose[0]))
        if best is None or score > best[0]:
            best = (score, pose, base, faces)
    return best


def run(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def to_png(bin_path, png_path):
    r = run(['ffmpeg', '-v', 'error', '-y', '-i', bin_path, '-frames:v', '1', png_path])
    if r.returncode != 0:
        raise RuntimeError('ffmpeg decode failed: ' + r.stdout[-400:])


def composite(base_png, face_png, left, top, out_png):
    filt = '[0:v][1:v]overlay={}:{}:format=auto,format=rgba,scale=944:532:flags=lanczos'.format(left, top)
    r = run(['ffmpeg', '-v', 'error', '-y', '-i', base_png, '-i', face_png,
             '-filter_complex', filt, '-frames:v', '1', out_png])
    if r.returncode != 0:
        raise RuntimeError('ffmpeg composite failed: ' + r.stdout[-400:])


def scale_only(base_png, out_png):
    r = run(['ffmpeg', '-v', 'error', '-y', '-i', base_png,
             '-vf', 'format=rgba,scale=944:532:flags=lanczos', '-frames:v', '1', out_png])
    if r.returncode != 0:
        raise RuntimeError('ffmpeg scale failed: ' + r.stdout[-400:])


def build(group, scene_id):
    pimg = find_pimg(group)
    if not pimg:
        return {'group': group, 'scene': scene_id, 'status': 'missing_pimg'}
    work = os.path.join(WORK, 'pimg', group)
    if os.path.isdir(work):
        shutil.rmtree(work)
    os.makedirs(work, exist_ok=True)
    r = run([MONO, DECOMPILER, '-raw', pimg, '-o', work])
    if r.returncode != 0:
        return {'group': group, 'scene': scene_id, 'status': 'decompile_failed', 'detail': r.stdout[-400:]}
    jp = os.path.join(work, group + 'a.json')
    if not os.path.exists(jp):
        cands = [f for f in os.listdir(work) if f.endswith('.json') and not f.endswith('.resx.json')]
        if not cands:
            return {'group': group, 'scene': scene_id, 'status': 'no_json'}
        jp = os.path.join(work, cands[0])
    data = json.load(open(jp))
    resx = json.load(open(os.path.join(work, group + 'a.resx.json')))['Resources']
    chosen = choose_pose(data['layers'], data['width'], data['height'])
    if not chosen:
        return {'group': group, 'scene': scene_id, 'status': 'no_full_pose', 'json': jp}
    _, pose, base, face_exprs = chosen
    exprs = ['a'] + sorted(face_exprs)
    os.makedirs(OUT, exist_ok=True)
    base_bin = os.path.join(work, resx[str(base['layer_id'])])
    base_png = os.path.join(work, 'base.png')
    to_png(base_bin, base_png)
    outputs = []
    for expr in exprs:
        out = os.path.join(OUT, group + '_' + expr + '.png')
        if expr == 'a':
            scale_only(base_png, out)
        else:
            face = None
            for layer in data['layers']:
                if layer.get('name') == pose + expr:
                    face = layer
                    break
            if not face:
                continue
            face_bin = os.path.join(work, resx[str(face['layer_id'])])
            face_png = os.path.join(work, 'face_' + expr + '.png')
            to_png(face_bin, face_png)
            composite(base_png, face_png, face['left'], face['top'], out)
        outputs.append({'expr': expr, 'file': os.path.basename(out), 'bytes': os.path.getsize(out)})
    return {
        'group': group, 'scene': scene_id, 'status': 'ok', 'pose': pose,
        'source': pimg, 'source_size': [data['width'], data['height']],
        'expressions': exprs, 'outputs': outputs,
    }


def main():
    os.makedirs(WORK, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    results = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(build, g, sid) for g, sid in SCENE_GROUPS]
        for fut in futures:
            try:
                res = fut.result()
            except Exception as exc:
                res = {'status': 'exception', 'detail': repr(exc)}
            results.append(res)
            log(json.dumps({k: res.get(k) for k in ('group', 'scene', 'status', 'pose', 'expressions')}, ensure_ascii=False))
    manifest = os.path.join(CACHE, 'scene_variants_manifest.json')
    json.dump(results, open(manifest, 'w'), ensure_ascii=False, indent=2)
    ok = sum(1 for r in results if r.get('status') == 'ok')
    log('DONE {}/{} manifest={}'.format(ok, len(results), manifest))


if __name__ == '__main__':
    main()
