#!/usr/bin/env python3
"""Emit the generative compose dataset from the vendored v2 wheel engine.

Source: data/wheels/compose-src (vendored from R2 ayoutube/
Svatantrya_Sanskrit_Wheels_15_Families_60_Levels.zip,
sha256 0f21d720f2c5880fa72adb0f189952fc170b284f077daf8e7010bf00bf1d08a0,
2026-11-12). v2 supersedes the 6-family/24-level zip AND our local numbers
extension. Enumeration runs the vendored engine itself via node
(tools/dump_compose.js), so the dataset can never drift from the code.

Status law: every row is MACHINE_PROPOSED_UNREVIEWED. Levels the author's own
REVIEW_NOTES flags as needing expert review before strict use additionally
carry HOLD and never deal a scored item: inherited 3.4/4.3/5.3/5.4, plus
7.4 (manner adverbs), 13.x (causatives) and 15.x (compounds).

  data/wheels/compose.json            svatantrya.compose/2 (9,507 rows + curriculum)
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
CURRICULUM = SVREAD / 'data' / 'wheels' / 'compose-src' / 'docs' / 'CURRICULUM_MAP.json'

HOLD_LEVELS = {'3.4', '4.3', '5.3', '5.4', '7.4',
               '13.1', '13.2', '13.3', '13.4',
               '15.1', '15.2', '15.3', '15.4'}
HOLD_WHY = {
    '3.4': 'narrative tenses need expert review (REVIEW_NOTES)',
    '4.3': 'comparatives need expert review (REVIEW_NOTES)',
    '5.3': 'constructed reasoning, not doctrine (REVIEW_NOTES)',
    '5.4': 'Trika lines are pedagogical sentences, not quotations (REVIEW_NOTES)',
    '7.4': 'manner adverbs must not be derived by blind suffix joining (REVIEW_NOTES)',
    '13.x': 'causative roots, participant case and second object uncertain (REVIEW_NOTES)',
    '15.x': 'compound membership, vigraha and declension uncertain (REVIEW_NOTES)',
}


def hold_reason(level: str) -> str:
    if level in HOLD_WHY:
        return HOLD_WHY[level]
    fam = level.split('.')[0]
    return HOLD_WHY.get(f'{fam}.x', '')


def build_rows() -> list:
    r = subprocess.run(['node', 'tools/dump_compose.js'], cwd=SVREAD,
                       capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        raise SystemExit(f'dump_compose.js failed: {r.stderr[-500:]}')
    rows = json.loads(r.stdout)
    for row in rows:
        row['status'] = 'MACHINE_PROPOSED_UNREVIEWED'
        row['review'] = 'HOLD' if row['level'] in HOLD_LEVELS else 'PROPOSED'
    return rows


def build_dataset(rows: list) -> dict:
    levels = sorted({(r['family'], r['family_n'], r['family_title'], r['level'],
                      r['level_title'], r['focus']) for r in rows},
                    key=lambda x: (x[1], x[3]))
    cur = json.loads(CURRICULUM.read_text(encoding='utf-8'))
    return {
        'format': 'svatantrya.compose/2',
        'source': 'vendored generative engine data/wheels/compose-src (see compose-provenance.json)',
        'counts': {'rows': len(rows), 'levels': len(levels),
                   'families': len({r['family'] for r in rows}),
                   'hold_levels': len(HOLD_LEVELS)},
        'levels': [{'family': f, 'family_n': n, 'family_title': t, 'level': lv,
                    'title': ti, 'focus': fo,
                    'review': 'HOLD' if lv in HOLD_LEVELS else 'PROPOSED',
                    'review_note': hold_reason(lv) or 'mechanical pass; expert review pending'}
                   for f, n, t, lv, ti, fo in levels],
        'curriculum': {'study_order': cur['study_order'],
                       'families': cur['families']},
        'rows': rows,
    }


def build_provenance(n_rows: int) -> dict:
    return {
        'format': 'svatantrya.compose-provenance/2',
        'r2_bucket': 'ayoutube',
        'r2_key': 'Svatantrya_Sanskrit_Wheels_15_Families_60_Levels.zip',
        'r2_sha256': '0f21d720f2c5880fa72adb0f189952fc170b284f077daf8e7010bf00bf1d08a0',
        'r2_uploaded': '2026-11-12T05:06:55Z',
        'supersedes': {
            'r2_key': 'Svatantrya_Sanskrit_Generative_Wheels_6_Families_24_Levels.zip',
            'r2_sha256': 'b721ad63fe5b8bd641fa8387af3d893eb1e9915e02cbeead09cdb20e6197de83',
            'note': 'v1 (6 families/24 levels) and our local 07-numbers extension are retired',
        },
        'vendored': ['src/core.js', 'src/shared.js', 'src/curriculum.js',
                     'src/families/01..15', 'docs/*', 'tests/exhaustive.test.js', 'README.md'],
        'vendored_excluded': ['preview_*.png', 'index.html', 'standalone.html',
                              'styles.css', 'src/ui.js', 'tools/build_standalone.py',
                              'tests/browser_smoke.py'],
        'rows': n_rows,
        'engines': {'generator': 'vendored v2 engine (node tools/dump_compose.js)',
                    'checker': 'tools/check_compose.py (Vidyut 0.4.0 surface check)'},
        'status_law': 'every row MACHINE_PROPOSED_UNREVIEWED; HOLD levels need expert review before gate/public use',
        'hold_levels': {lv: hold_reason(lv) for lv in sorted(HOLD_LEVELS)},
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
