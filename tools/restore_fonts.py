#!/usr/bin/env python3
"""Restaure les polices à partir de l'archive 243.zip de l'utilisateur (aucune police incluse ici)."""
from pathlib import Path
from zipfile import ZipFile
import sys,subprocess
if len(sys.argv)<2:
    raise SystemExit('Usage : python tools/restore_fonts.py "C:/chemin/243.zip"')
src=Path(sys.argv[1]); target=Path(__file__).resolve().parents[1]/'assets/fonts'
with ZipFile(src) as z:
    names=[n for n in z.namelist() if n.startswith('assets/fonts/') and n.lower().endswith('.woff2')]
    if not names: raise SystemExit('Archive invalide : aucun assets/fonts/*.woff2 trouvé')
    for name in names:
        dst=target/Path(name).name; dst.write_bytes(z.read(name)); print('Restauré',dst.name)
subprocess.run([sys.executable,str(Path(__file__).with_name('build-sw.py'))],check=True)
print('Polices restaurées depuis votre propre archive. Cache régénéré.')
