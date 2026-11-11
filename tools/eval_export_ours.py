#!/usr/bin/env python3
"""eval_export_ours.py — export OUR translation as a blind-eval candidate.

Reads the held-out set, then for each passage takes our own translation in a
fixed preference order (never generating anything):

  1. translation-work/<work>/data/<target>.l3.json  (final, line-by-line)
  2. translation-work/<work>/data/<target>.l2.json  (our translation)
  3. svread data/<work>.json verse layer l3, then l2 (vendored copy)

Writes data/eval/candidates/ours.json = {passage_id: text} plus a small
manifest recording which layer/where each text came from. Passages with no
translation on file are omitted (coverage is measured, not invented).

  python3 tools/eval_export_ours.py
  python3 tools/eval_export_ours.py --check
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
TW = Path(os.environ.get('TRANSLATION_WORK', '/root/translation-work'))
SET = SVREAD / 'data' / 'eval' / 'trika-blind-50.json'
OUTDIR = SVREAD / 'data' / 'eval' / 'candidates'
OUT = OUTDIR / 'ours.json'
MANIFEST = OUTDIR / 'ours.manifest.json'


def layer_text(path: Path, key: str) -> str:
    try:
        rows = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return ''
    if not isinstance(rows, list):
        return ''
    parts = []
    for r in rows:
        if isinstance(r, dict):
            v = r.get(key) or ''
            if isinstance(v, str) and v.strip():
                parts.append(v.strip())
    return ' '.join(parts)


def from_tw(work: str, target: str):
    base = TW / work / 'data' / target
    for ext, key, label in (('.l3.json', 'l3', 'translation-work L3'),
                            ('.l2.json', 'plain_english', 'translation-work L2')):
        p = Path(str(base) + ext)
        if p.exists():
            t = layer_text(p, key)
            if t:
                return t, label, str(p)
    return '', '', ''


def from_svread(work: str, target: str):
    p = SVREAD / 'data' / f'{work}.json'
    if not p.exists():
        return '', '', ''
    try:
        b = json.loads(p.read_text(encoding='utf-8'))
    except ValueError:
        return '', '', ''
    rows = b.get('verses') or b.get('chunks') or []
    parts = []
    for r in rows:
        if not isinstance(r, dict):
            continue
        vid = str(r.get('id') or r.get('chunk') or '')
        if vid == target or vid.startswith(target + '-v'):
            v = (r.get('l3') or r.get('l2') or '').strip()
            if v:
                parts.append(v)
    if parts:
        return ' '.join(parts), 'svread bundle L3/L2', str(p)
    return '', '', ''


def build() -> tuple[dict, dict]:
    doc = json.loads(SET.read_text(encoding='utf-8'))
    cand, prov = {}, {}
    for it in doc['items']:
        pid, work, target = it['id'], it['work'], it['target']
        text, label, where = from_tw(work, target)
        if not text:
            text, label, where = from_svread(work, target)
        if text:
            cand[pid] = text
            prov[pid] = {'layer': label, 'source': where}
    manifest = {
        'format': 'svatantrya.eval-candidate/1',
        'candidate': 'ours',
        'set': 'trika-blind-50.json',
        'passages_with_text': len(cand),
        'passages_total': len(doc['items']),
        'note': ('Our own translations, taken from on-file layers only. Missing '
                 'passages are omitted so coverage is measured honestly; no text '
                 'is generated for this export.'),
        'provenance': prov,
    }
    return cand, manifest


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    if not SET.exists():
        print('eval_export_ours: blind set missing', file=sys.stderr)
        return 1
    cand, manifest = build()
    if args.check:
        if not OUT.exists() or not MANIFEST.exists():
            print('eval_export_ours --check: candidates/ours.json missing', file=sys.stderr)
            return 1
        cur = json.loads(OUT.read_text(encoding='utf-8'))
        if cur != cand:
            print('eval_export_ours --check: ours.json differs', file=sys.stderr)
            return 1
        print(f"eval_export_ours --check: GREEN ({len(cand)} passages)")
        return 0
    OUTDIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(cand, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
                   encoding='utf-8')
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
                        encoding='utf-8')
    print(f"eval_export_ours: {len(cand)}/{manifest['passages_total']} passages exported "
          f"-> {OUT.relative_to(SVREAD)}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
