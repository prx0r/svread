#!/usr/bin/env python3
"""eval_blind.py — record candidate coverage for the human-scoring set (W5).

Automation is deliberately weak here: it validates the set, computes
COVERAGE for a candidate file, and writes a results skeleton with
`human: PENDING_HUMAN`. Scoring (correction effort) is a human job per
RUBRIC.md — a machine "quality score" is exactly what this project refuses.

  python3 tools/eval_blind.py --check
  python3 tools/eval_blind.py --candidate cand.json --name my-model
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import time
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
SET = SVREAD / 'data' / 'eval' / 'trika-blind-50.json'
RUBRIC = SVREAD / 'data' / 'eval' / 'RUBRIC.md'
RESULTS = SVREAD / 'data' / 'eval'
SHA_RE = re.compile(r'^[0-9a-f]{64}$')


def check_set() -> list[str]:
    if not SET.is_file():
        return ['trika-blind-50.json missing']
    if not RUBRIC.is_file():
        return ['RUBRIC.md missing']
    d = json.loads(SET.read_text(encoding='utf-8'))
    probs = []
    if d.get('format') != 'svatantrya.blind-eval/1':
        probs.append('bad format tag')
    items = d.get('items', [])
    if len(items) != 50:
        probs.append(f'count {len(items)} != 50')
    ids = [x.get('id') for x in items]
    if len(set(ids)) != len(ids):
        probs.append('duplicate ids')
    for x in items:
        if not x.get('held_out'):
            probs.append(f"{x.get('id')}: held_out not true")
        if x.get('held_out_scope') != 'human-scoring-only':
            probs.append(f"{x.get('id')}: held_out_scope must be human-scoring-only")
        if not x.get('text'):
            probs.append(f"{x.get('id')}: empty text")
        if not (x.get('trace_sha256') and SHA_RE.match(x['trace_sha256'])):
            probs.append(f"{x.get('id')}: bad trace_sha256")
        if x.get('category') is not None and x.get('classify') != 'human':
            probs.append(f"{x.get('id')}: category set without classify=human")
    policy = d.get('held_out_policy') or ''
    if 'not a sealed holdout' not in policy or 'No human correction scores were used to select items' not in policy:
        probs.append('held_out_policy must state the retrospective scope and selection rule')
    return probs


def coverage(cand: dict, items: list) -> dict:
    want = {x['id']: x for x in items}
    got = set(cand)
    missing = sorted(set(want) - got)
    extra = sorted(got - set(want))
    empty = sorted(k for k, v in cand.items() if not str(v or '').strip())
    return {'targets': len(want), 'answered': len(got & set(want)),
            'missing': missing, 'extra': extra, 'empty': empty,
            'coverage_complete': not missing and not extra and not empty}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--candidate', help='JSON file {target_id: translation}')
    ap.add_argument('--name', default=None, help='candidate name for results file')
    args = ap.parse_args()

    probs = check_set()
    if probs:
        for p in probs:
            print('FAIL ' + p, file=sys.stderr)
        return 1
    if args.check:
        print('eval_blind --check: GREEN (50 passages, human-scoring holdout, rubric present)')
        return 0

    if not args.candidate:
        print('eval_blind: need --candidate file.json or --check', file=sys.stderr)
        return 2
    d = json.loads(SET.read_text(encoding='utf-8'))
    try:
        cand = json.loads(Path(args.candidate).read_text(encoding='utf-8'))
    except (OSError, ValueError) as e:
        print(f'eval_blind: cannot read candidate: {e}', file=sys.stderr)
        return 2
    if not isinstance(cand, dict):
        print('eval_blind: candidate must be {target_id: text}', file=sys.stderr)
        return 2
    name = args.name or Path(args.candidate).stem
    safe = re.sub(r'[^a-z0-9-]+', '-', name.lower()).strip('-') or 'candidate'
    out = RESULTS / f'results-{safe}.json'
    doc = {
        'format': 'svatantrya.eval-result/1',
        'candidate': safe,
        'source_file': str(args.candidate),
        'set': 'trika-blind-50.json',
        'recorded_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'coverage': coverage(cand, d['items']),
        'human': {'status': 'PENDING_HUMAN',
                  'fields': ['edits', 'wrong_terms', 'unsupported',
                             'survives_gates', 'minutes', 'verdict', 'notes'],
                  'note': ('Fill per RUBRIC.md. Automation computed coverage only; '
                           'no quality numbers exist until a human writes them.')},
    }
    out.write_text(json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
                   encoding='utf-8')
    cov = doc['coverage']
    print(f"eval_blind: {safe} → {cov['answered']}/{cov['targets']} answered, "
          f"missing={len(cov['missing'])} extra={len(cov['extra'])} "
          f"empty={len(cov['empty'])} · results {out.name} (human pending)")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
