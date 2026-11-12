#!/usr/bin/env python3
"""Emit the generative compose dataset from the vendored wheel engine.

Source: data/wheels/compose-src (vendored from R2 ayoutube/
Svatantrya_Sanskrit_Generative_Wheels_6_Families_24_Levels.zip,
sha256 b721ad63fe5b8bd641fa8387af3d893eb1e9915e02cbeead09cdb20e6197de83,
2026-11-12). Enumeration runs the vendored engine itself via node
(tools/dump_compose.js), so the dataset can never drift from the code.

Status law: every row is MACHINE_PROPOSED_UNREVIEWED. Levels the zip's own
REVIEW_NOTES flags (3.4 narrative tenses, 4.3 comparatives, 5.3/5.4
constructed reasoning, tense-dependent 6.2) additionally carry HOLD:
expert review before any gate or public exercise use.

  data/wheels/compose.json            svatantrya.compose/1 (4,755 rows)
  data/wheels/compose-provenance.json source + review flags

  python3 tools/emit_compose.py
  python3 tools/emit_compose.py --check
"""
from __future__ import annotations
import argparse
import json
import subprocess
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
OUT = SVREAD / 'data' / 'wheels'

HOLD_LEVELS = {'3.4', '4.3', '5.3', '5.4', '6.2'}
HOLD_WHY = {
    '3.4': 'narrative tenses need expert review (zip REVIEW_NOTES)',
    '4.3': 'comparatives need expert review (zip REVIEW_NOTES)',
    '5.3': 'constructed reasoning, not doctrine (zip REVIEW_NOTES)',
    '5.4': 'Trika lines are pedagogical sentences, not quotations (zip REVIEW_NOTES)',
    '6.2': 'tense-dependent verb forms need expert review (zip REVIEW_NOTES)',
}


def build_rows() -> list:
    r = subprocess.run(['node', 'tools/dump_compose.js'], cwd=SVREAD,
                       capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        raise SystemExit(f'dump_compose.js failed: {r.stderr[-500:]}')
    rows = json.loads(r.stdout)
    for row in rows:
        row['status'] = 'MACHINE_PROPOSED_UNREVIEWED'
        row['review'] = ('HOLD' if row['level'] in HOLD_LEVELS else 'PROPOSED')
    return rows


def build_dataset(rows: list) -> dict:
    levels = sorted({(r['family'], r['family_n'], r['level'], r['level_title'])
                     for r in rows})
    return {
        'format': 'svatantrya.compose/1',
        'source': 'vendored generative engine data/wheels/compose-src (see compose-provenance.json)',
        'counts': {'rows': len(rows), 'levels': len(levels),
                   'hold_levels': sorted(HOLD_LEVELS)},
        'levels': [{'family': f, 'family_n': n, 'level': lv, 'title': t,
                    'review': 'HOLD' if lv in HOLD_LEVELS else 'PROPOSED',
                    'review_note': HOLD_WHY.get(lv, 'mechanical pass; expert review pending')}
                   for f, n, lv, t in levels],
        'rows': rows,
    }


def build_provenance(n_rows: int) -> dict:
    return {
        'format': 'svatantrya.compose-provenance/1',
        'r2_bucket': 'ayoutube',
        'r2_key': 'Svatantrya_Sanskrit_Generative_Wheels_6_Families_24_Levels.zip',
        'r2_sha256': 'b721ad63fe5b8bd641fa8387af3d893eb1e9915e02cbeead09cdb20e6197de83',
        'r2_uploaded': '2026-11-12T03:48:14Z',
        'vendored': ['core.js', 'shared.js', 'families/01..06', 'docs/*',
                     'tests/exhaustive.test.js', 'README.md'],
        'vendored_excluded': ['preview_*.png (4 screenshots)', 'index.html',
                              'standalone.html', 'styles.css', 'src/ui.js',
                              'tools/build_standalone.py', 'tests/browser_smoke.py'],
        'rows': n_rows,
        'status_law': 'every row MACHINE_PROPOSED_UNREVIEWED; HOLD levels need expert review before gate/public use',
        'hold_levels': {lv: HOLD_WHY[lv] for lv in sorted(HOLD_LEVELS)},
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    rows = build_rows()
    files = {
        'compose.json': json.dumps(build_dataset(rows), ensure_ascii=False, sort_keys=True, indent=1) + '\n',
        'compose-provenance.json': json.dumps(build_provenance(len(rows)), ensure_ascii=False, sort_keys=True, indent=2) + '\n',
    }
    if args.check:
        ok = True
        for name, want in files.items():
            p = OUT / name
            if not p.exists():
                print(f'emit_compose --check: missing {name}', file=sys.stderr)
                ok = False
            elif p.read_text(encoding='utf-8') != want:
                print(f'emit_compose --check: {name} differs', file=sys.stderr)
                ok = False
        return 0 if ok else 1
    for name, want in files.items():
        (OUT / name).write_text(want, encoding='utf-8')
    print(f'emit_compose: {len(rows)} rows, {len(HOLD_LEVELS)} HOLD levels')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
