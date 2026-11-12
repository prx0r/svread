#!/usr/bin/env python3
"""Emit the four-wheel pack dataset (pack x wheel states).

Source: data/wheels/compose-src/src/packs.js (local extension) + wheelmap.json.
Enumeration runs the vendored engine via node (tools/dump_packs.js), so the
dataset cannot drift from the pack definitions.

  data/wheels/compose-packs.json   svatantrya.compose-packs/1
  python3 tools/emit_packs.py
  python3 tools/emit_packs.py --check
"""
from __future__ import annotations
import argparse
import json
import subprocess
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
OUT = SVREAD / 'data' / 'wheels'
WHEELMAP = OUT / 'wheelmap.json'


def build_rows() -> dict:
    r = subprocess.run(['node', 'tools/dump_packs.js'], cwd=SVREAD,
                       capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        raise SystemExit(f'dump_packs.js failed: {r.stderr[-500:]}')
    return json.loads(r.stdout)


def build_dataset(dump: dict) -> dict:
    rows = [row for row in dump['rows'] if 'error' not in row]
    errors = [row for row in dump['rows'] if 'error' in row]
    wm = json.loads(WHEELMAP.read_text(encoding='utf-8'))
    wheels = {w['id']: w for w in wm['wheels']}
    per = {}
    for row in rows:
        key = f"{row['pack']}/{row['level']}"
        per[key] = per.get(key, 0) + 1
    for row in rows:
        row['status'] = 'MACHINE_PROPOSED_UNREVIEWED'
    return {
        'format': 'svatantrya.compose-packs/1',
        'source': 'local extension data/wheels/compose-src/src/packs.js + wheelmap.json',
        'counts': {'rows': len(rows), 'errors': len(errors),
                   'packs': len(dump['packs']), 'per_pack_level': per},
        'wheels': {**{k: {'title': v['title'], 'rings': v['rings']} for k, v in wheels.items()}},
        'packs': dump['packs'],
        'rows': rows,
        'error_rows': errors,
        'note': ('Packs supply vetted inflected lexemes; the wheel supplies grammar. '
                 'Only the Action wheel (3.1/3.2) is pack-enabled in this pass. '
                 'All rows MACHINE_PROPOSED_UNREVIEWED.'),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    ds = build_dataset(build_rows())
    text = json.dumps(ds, ensure_ascii=False, sort_keys=True, indent=1) + '\n'
    target = OUT / 'compose-packs.json'
    if args.check:
        if not target.exists():
            print('emit_packs --check: missing compose-packs.json', file=sys.stderr)
            return 1
        if target.read_text(encoding='utf-8') != text:
            print('emit_packs --check: compose-packs.json differs', file=sys.stderr)
            return 1
        return 0
    target.write_text(text, encoding='utf-8')
    c = ds['counts']
    print(f"emit_packs: {c['rows']} states, {c['packs']} packs, {c['errors']} errors")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
