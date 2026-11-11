#!/usr/bin/env python3
"""Cross-check curated wheel forms (vendored teaching tier) against Vidyut.

Reads the curated table out of vendor/sanskrit-bruno-wheels/data.js via node
(no npm install; the file supports require()), derives each form with Vidyut
0.4.0, and writes data/grammar/crosscheck.json:

  {form, deva_curated, machine_slpi, machine_iast, agree, note}

agree=true only on exact surface match. Disagreement is data, not failure:
kim+thal (katha vs katham) and eka+tral (machine gap) are the honest flagships.
The script exits 0 even with disagreements; it exits nonzero only when the
machine cannot run (missing package/kosha) or the vendor file changed shape.

Usage:
  python3 tools/check_curated.py            # derive + write crosscheck.json
"""
from __future__ import annotations
import hashlib
import importlib.metadata
import json
import subprocess
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
VENDOR = SVREAD / 'vendor' / 'sanskrit-bruno-wheels' / 'data.js'
KOSHA_DEFAULT = Path('/root/vidyut-0.4.0/kosha')

DUMP_JS = """
const D = require(%s);
const out = {stems: D.stems, endings: D.endings, words: D.words};
console.log(JSON.stringify(out));
""" % json.dumps(str(VENDOR))

# curated stem id -> SLP1 base for Vidyut
BASE_SLP1 = {'kim': 'kim', 'tad': 'tad', 'yad': 'yad', 'sarva': 'sarva',
             'anya': 'anya', 'eka': 'eka'}
ATTR_TADDHITA = {'place': 'tral', 'time': 'dA', 'source': 'tasil', 'manner': 'TAl'}


def main() -> int:
    try:
        version = importlib.metadata.version('vidyut')
    except importlib.metadata.PackageNotFoundError:
        print('check_curated: vidyut package not installed', file=sys.stderr)
        return 1
    if version != '0.4.0':
        print(f'check_curated: expected vidyut 0.4.0, found {version}', file=sys.stderr)
        return 1
    from vidyut.lipi import transliterate, Scheme
    from vidyut.prakriya import Vyakarana, Pada, Pratipadika, Taddhita
    from vidyut import kosha as kosha_mod

    kosha_path = Path('/root/vidyut-0.4.0/kosha')
    k = kosha_mod.Kosha(str(kosha_path))
    v = Vyakarana()

    raw = subprocess.run(['node', '-e', DUMP_JS], capture_output=True, text=True, check=True)
    curated = json.loads(raw.stdout)
    vendor_sha = hashlib.sha256(VENDOR.read_bytes()).hexdigest()

    def ia(slp: str) -> str:
        try:
            return transliterate(slp, Scheme.Slp1, Scheme.Iast)
        except Exception:
            return slp

    def deva_of(iast: str) -> str:
        try:
            return transliterate(iast, Scheme.Iast, Scheme.Devanagari)
        except Exception:
            return iast

    rows = []
    for stem in curated['stems']:
        for end in curated['endings']:
            cell = (curated['words'].get(stem['id']) or {}).get(end['id'])
            fid = f"{stem['id']}-{end['id']}"
            if not cell:
                rows.append({'id': fid, 'deva_curated': None, 'machine_surfaces': [],
                             'machine_iast': None, 'agree': None, 'note': 'curated gap (intentional beginner omission)'})
                continue
            deva_c = cell['word']
            machines = []
            note = ''
            try:
                base = BASE_SLP1[stem['id']]
                pp = Pratipadika.taddhitanta(Pratipadika.basic(base),
                                             getattr(Taddhita, ATTR_TADDHITA[end['id']]))
                res = v.derive(Pada.make_avyaya(pp))
                for r2 in res[:4]:
                    s2 = ia(r2.text)
                    if s2 not in machines:
                        machines.append(s2)
            except Exception as exc:
                note = f'machine error: {exc}'
            mi = machines[0] if machines else None
            agree = True if any(deva_of(m) == deva_c for m in machines) else (False if machines else None)
            if fid == 'kim-manner' and not agree:
                note = ('expected flagship: kim+thal derives katha; katham is kim+thamu '
                        'per 5.3.24-25. Curated katham stands as the taught form.')
            elif not agree and machines:
                note = f'machine gives {", ".join(machines)}; curated {deva_c} stands unless adjudicated'
            elif not machines and cell:
                note = 'machine gap (no derivation in Vidyut 0.4.0); curated form stands'
            rows.append({'id': fid, 'deva_curated': deva_c, 'machine_surfaces': machines,
                         'machine_iast': mi, 'agree': agree,
                         'note': note})

    summary = {'agree': sum(1 for r in rows if r['agree'] is True),
               'disagree': sum(1 for r in rows if r['agree'] is False),
               'gap': sum(1 for r in rows if r['agree'] is None)}
    doc = {'format': 'svatantrya.curated-crosscheck/1',
           'status': 'machine-generated-unreviewed',
           'vendor_file': 'vendor/sanskrit-bruno-wheels/data.js',
           'vendor_sha256': vendor_sha,
           'generator': {'name': 'vidyut', 'version': version},
           'warning': ('Agreement is exact-surface only. A disagree row is a teaching '
                       'decision or a machine gap, never a silent override. Curated '
                       'forms stand until adjudicated by a scholar.'),
           'summary': summary, 'rows': rows}
    out = SVREAD / 'data' / 'grammar' / 'crosscheck.json'
    out.write_text(json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
                   encoding='utf-8')
    print(f"check_curated: {summary['agree']} agree, {summary['disagree']} disagree, "
          f"{summary['gap']} gap; vendor {vendor_sha[:12]}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
