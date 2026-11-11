#!/usr/bin/env python3
"""eval_score_sheet.py — build the blind human scoring sheet for two candidates.

The scorer must not know which translation came from which system, and the
presentation order must not correlate with the candidate. So:

  * order and A/B identity are derived from sha256(seed, passage id)
  * the worksheet carries only "Version A" / "Version B"
  * the mapping lives in a separate key file that the worksheet never prints
  * every field a human must fill is present and null — nothing is pre-filled

Inputs are candidate files ({passage_id: text}); a manifest from
eval_export_ours.py can restrict the sheet to full-coverage passages.

  python3 tools/eval_score_sheet.py \
      --a data/eval/candidates/ours.json \
      --b data/eval/candidates/mitra-mt.json \
      --a-manifest data/eval/candidates/ours.manifest.json \
      --out experiments/mitra-mt/scoring --seed 20261111

  python3 tools/eval_score_sheet.py ... --check    # verify an existing sheet
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
SET = SVREAD / 'data' / 'eval' / 'trika-blind-50.json'
FIELDS = ('edits', 'wrong_terms', 'unsupported', 'survives_gates', 'minutes',
          'verdict', 'notes')


def pick(seed: str, *parts: str) -> int:
    h = hashlib.sha256(('|'.join((seed,) + parts)).encode()).hexdigest()
    return int(h[:8], 16)


def build(set_path: Path, a: dict, b: dict, a_manifest: dict | None,
          b_manifest: dict | None, seed: str):
    doc = json.loads(set_path.read_text(encoding='utf-8'))
    items = {it['id']: it for it in doc['items']}

    def full(cand_id: str, man: dict | None) -> bool:
        if not man:
            return True
        p = (man.get('provenance') or {}).get(cand_id)
        return bool(p) and not p.get('partial')

    ids = [pid for pid in items if pid in a and pid in b
           and full(pid, a_manifest) and full(pid, b_manifest)]
    ids.sort(key=lambda pid: pick(seed, 'order', pid))

    rows, key, balance = [], {}, {'A_first': 0, 'B_first': 0}
    for pid in ids:
        swap = pick(seed, 'swap', pid) % 2 == 1
        first, second = ('B', 'A') if swap else ('A', 'B')
        key[pid] = {'A': 'b' if swap else 'a', 'B': 'a' if swap else 'b'}
        balance['B_first' if swap else 'A_first'] += 1
        rows.append({
            'id': pid,
            'work': items[pid]['work'],
            'difficulty': items[pid]['difficulty'],
            'source': items[pid]['text'],
            'presentation': [first, second],
            'versions': {
                'A': {'text': b[pid] if swap else a[pid], 'verdict': None,
                      'edits': None, 'wrong_terms': None, 'unsupported': None,
                      'survives_gates': None, 'minutes': None, 'notes': None},
                'B': {'text': a[pid] if swap else b[pid], 'verdict': None,
                      'edits': None, 'wrong_terms': None, 'unsupported': None,
                      'survives_gates': None, 'minutes': None, 'notes': None},
            },
            'category': items[pid].get('category'),
        })
    return rows, key, balance


def render_md(rows: list) -> str:
    out = ['# Blind translation scoring sheet', '',
           'Score each version separately. Do not try to guess which system',
           'produced which — if you can tell, note it, but score the text.',
           'Fields: edits, wrong_terms, unsupported, survives_gates',
           '(yes/partial/no), minutes, verdict (ACCEPT/REVISE/REJECT), notes.', '',
           f'{len(rows)} passages, order randomised with a fixed seed.', '']
    for i, r in enumerate(rows, 1):
        out += [f'## {i}. `{r["id"]}` — {r["work"]} ({r["difficulty"]})', '',
                '**Sanskrit**', '', '> ' + r['source'], '']
        for v in r['presentation']:
            out += [f'### Version {v}', '', '> ' + r['versions'][v]['text'], '',
                    '| field | value |', '|---|---|']
            for f in FIELDS:
                out.append(f'| `{f}` | |')
            out.append('')
    return '\n'.join(out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--a', required=True)
    ap.add_argument('--b', required=True)
    ap.add_argument('--a-manifest')
    ap.add_argument('--b-manifest')
    ap.add_argument('--set', default=str(SET))
    ap.add_argument('--out', default='experiments/mitra-mt/scoring')
    ap.add_argument('--seed', default='20261111')
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    a = json.loads(Path(args.a).read_text(encoding='utf-8'))
    b = json.loads(Path(args.b).read_text(encoding='utf-8'))
    am = json.loads(Path(args.a_manifest).read_text(encoding='utf-8')) if args.a_manifest else None
    bm = json.loads(Path(args.b_manifest).read_text(encoding='utf-8')) if args.b_manifest else None

    rows, key, balance = build(Path(args.set), a, b, am, bm, args.seed)
    unmeasured = [r['id'] for r in rows
                  if am and am.get('provenance', {}).get(r['id'], {}).get('coverage') is None]
    for pid in key:
        key[pid]['coverage_unmeasured'] = pid in unmeasured
    if not rows:
        print('eval_score_sheet: no shared passages — nothing to score', file=sys.stderr)
        return 1

    out = Path(args.out)
    md = render_md(rows)
    # provenance words inside a passage are the translator's, not the sheet's:
    # only structural lines can leak identity
    structural = '\n'.join(l for l in md.splitlines() if not l.startswith('> '))
    leaked = [n for n in ('mitra', 'ours', 'qwen') if n in structural.lower()]
    if leaked:
        print(f'eval_score_sheet: worksheet leaks candidate identity {leaked}',
              file=sys.stderr)
        return 1

    if args.check:
        for name in ('worksheet.md', 'sheet.json', 'key.json'):
            if not (out / name).exists():
                print(f'eval_score_sheet --check: {name} missing', file=sys.stderr)
                return 1
        cur = json.loads((out / 'sheet.json').read_text(encoding='utf-8'))
        if [r['id'] for r in cur['rows']] != [r['id'] for r in rows]:
            print('eval_score_sheet --check: sheet.json is stale', file=sys.stderr)
            return 1
        print(f'eval_score_sheet --check: GREEN ({len(rows)} passages, '
              f'{balance["A_first"]}/{balance["B_first"]} A/B first)')
        return 0

    out.mkdir(parents=True, exist_ok=True)
    (out / 'worksheet.md').write_text(md, encoding='utf-8')
    (out / 'key.json').write_text(json.dumps(
        {'seed': args.seed, 'note': 'Scorer must not read this file.',
         'a': args.a, 'b': args.b, 'mapping': key},
        indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    (out / 'sheet.json').write_text(json.dumps(
        {'format': 'svatantrya.score-sheet/1', 'seed': args.seed,
         'passages': len(rows), 'rows': rows},
        indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    if unmeasured:
        print(f'eval_score_sheet: note {len(unmeasured)} passages have unmeasurable '
              f'coverage in the A manifest (no Sanskrit cites) — included, flagged in key')
    print(f'eval_score_sheet: {len(rows)} passages '
          f'({balance["A_first"]} A-first / {balance["B_first"]} B-first) -> {out}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
