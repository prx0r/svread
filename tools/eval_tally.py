#!/usr/bin/env python3
"""eval_tally.py — turn a filled blind sheet into per-candidate results.

Reads sheet.json (human-filled) and key.json (the sealed mapping), checks that
every field is filled, and writes data/eval/results-<candidate>.json with the
rubric's numbers. Fail-closed:

  * any null field in any version        -> refuse (exit 1), list the ids
  * a verdict outside ACCEPT/REVISE/REJECT -> refuse
  * survives_gates outside yes/partial/no  -> refuse
  * minutes not a number in 0..240        -> refuse
  * a candidate with zero scored passages -> refuse

It never invents a number and never averages across candidates.

  python3 tools/eval_tally.py --sheet experiments/mitra-mt/scoring/sheet.json \
      --key experiments/mitra-mt/scoring/key.json
"""
from __future__ import annotations
import argparse
import json
import statistics
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
CAND = SVREAD / 'data' / 'eval' / 'candidates'
VERDICTS = {'ACCEPT', 'REVISE', 'REJECT'}
GATES = {'yes', 'partial', 'no'}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--sheet', required=True)
    ap.add_argument('--key', required=True)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    sheet = json.loads(Path(args.sheet).read_text(encoding='utf-8'))
    key = json.loads(Path(args.key).read_text(encoding='utf-8'))
    mapping = key['mapping']

    missing, bad = [], []
    per = {}
    for row in sheet['rows']:
        pid = row['id']
        m = mapping.get(pid)
        if not m:
            bad.append(f'{pid}: not in key')
            continue
        for v in ('A', 'B'):
            cell = row['versions'][v]
            for f in ('edits', 'wrong_terms', 'unsupported', 'survives_gates',
                      'minutes', 'verdict', 'notes'):
                if cell.get(f) is None:
                    missing.append(f'{pid}:{v}:{f}')
            if cell.get('verdict') is not None and cell['verdict'] not in VERDICTS:
                bad.append(f'{pid}:{v}:verdict={cell["verdict"]!r}')
            if cell.get('survives_gates') is not None and cell['survives_gates'] not in GATES:
                bad.append(f'{pid}:{v}:survives_gates={cell["survives_gates"]!r}')
            mi = cell.get('minutes')
            if mi is not None and not (isinstance(mi, (int, float)) and 0 <= mi <= 240):
                bad.append(f'{pid}:{v}:minutes={mi!r}')
            who = 'a' if m[v] == 'a' else 'b'
            per.setdefault(who, []).append({
                'id': pid, 'category': row.get('category'),
                **{f: cell.get(f) for f in ('edits', 'wrong_terms', 'unsupported',
                                            'survives_gates', 'minutes', 'verdict', 'notes')},
            })

    if missing:
        print(f'REFUSE: {len(missing)} unfilled fields, e.g. {missing[:5]}', file=sys.stderr)
    if bad:
        print(f'REFUSE: {len(bad)} invalid values, e.g. {bad[:5]}', file=sys.stderr)
    if missing or bad:
        return 1

    names = {}
    for who, label in (('a', key['a']), ('b', key['b'])):
        name = Path(label).stem.replace('results-', '').replace('.json', '')
        names[who] = name
        rows = per.get(who, [])
        if not rows:
            print(f'REFUSE: no scored passages for {name}', file=sys.stderr)
            return 1

    out = {}
    for who, rows in per.items():
        name = names[who]
        minutes = [r['minutes'] for r in rows]
        cats = {}
        for r in rows:
            c = r.get('category') or 'unclassified'
            cats.setdefault(c, []).append(r['minutes'])
        rec = {
            'format': 'svatantrya.eval-results/1',
            'candidate': name,
            'passages_scored': len(rows),
            'human': {
                'scored_by': 'human (sheet ' + Path(args.sheet).name + ')',
                'seed': sheet.get('seed'),
                'status': 'SCORED',
            },
            'mean_minutes': round(statistics.mean(minutes), 2),
            'median_minutes': statistics.median(minutes),
            'total_edits': sum(r['edits'] for r in rows),
            'total_wrong_terms': sum(r['wrong_terms'] for r in rows),
            'total_unsupported': sum(r['unsupported'] for r in rows),
            'accept_rate': round(sum(1 for r in rows if r['verdict'] == 'ACCEPT') / len(rows), 3),
            'no_edit_count': sum(1 for r in rows if r['edits'] == 0),
            'survives_gates': {g: sum(1 for r in rows if r['survives_gates'] == g)
                               for g in ('yes', 'partial', 'no')},
            'per_category_mean_minutes': {c: round(statistics.mean(v), 2)
                                          for c, v in sorted(cats.items())},
            'rows': rows,
        }
        out[name] = rec
        if not args.dry_run:
            CAND.mkdir(parents=True, exist_ok=True)
            (SVREAD / 'data' / 'eval' / f'results-{name}.json').write_text(
                json.dumps(rec, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')

    for name, rec in out.items():
        print(f'{name}: {rec["passages_scored"]} scored · '
              f'mean {rec["mean_minutes"]} min · accept {rec["accept_rate"]} · '
              f'no-edit {rec["no_edit_count"]}')
    print('tally complete' + (' (dry run, nothing written)' if args.dry_run else ''))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
