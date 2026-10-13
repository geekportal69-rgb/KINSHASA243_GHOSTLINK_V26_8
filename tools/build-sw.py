#!/usr/bin/env python3
"""GHOSTLINK V12.3 — génère sw.js : liste TOUS les fichiers du jeu à mettre en cache
pour un fonctionnement 100 % hors ligne. À relancer après chaque modification :
    python3 tools/build-sw.py
"""
import os, hashlib, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIR = {'.git', 'tools', 'node_modules'}
SKIP_EXT = {'.md', '.py', '.zip'}
files, h = [], hashlib.sha1()
for d, dirs, fs in os.walk(ROOT):
    dirs[:] = sorted(x for x in dirs if x not in SKIP_DIR)
    for f in sorted(fs):
        if f == 'sw.js' or os.path.splitext(f)[1] in SKIP_EXT: continue
        p = os.path.relpath(os.path.join(d, f), ROOT).replace(os.sep, '/')
        files.append(p)
        with open(os.path.join(d, f), 'rb') as fh: h.update(p.encode()); h.update(fh.read())
ver = h.hexdigest()[:10]
tpl = open(os.path.join(ROOT, 'tools', 'sw.template.js'), encoding='utf-8').read()
out = tpl.replace('__VERSION__', ver).replace('__FILES__', json.dumps(['./'] + files, ensure_ascii=False, indent=0))
open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8').write(out)
print('sw.js', ver, len(files), 'fichiers')
