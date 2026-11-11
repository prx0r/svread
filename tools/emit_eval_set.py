#!/usr/bin/env python3
"""emit_eval_set.py — the held-out Trika blind set (W5 scaffold).

Builds data/eval/trika-blind-50.json: 50 passages, machine-selected
deterministically, stratified one-per-work across the trace corpus (max
diversity), each pinned to its trace sha256 and source text.

Held-out policy (recorded in the file): these passages are never used in
prompts, tuning, or training. Selection and difficulty are machine signals;
category classification is PENDING a human pass — nothing here pretends to be
an expert label.

  python3 tools/emit_eval_set.py
  python3 tools/emit_eval_set.py --check
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
OUT = SVREAD / 'data' / 'eval' / 'trika-blind-50.json'
N = 50
HOLD = {'ghatakarpara'}  # source-alignment hold: never in a benchmark

# bundle text is IAST: standalone 'na'/'naḥ' = naive negation signal
NEG = re.compile(r'(?<!\S)na(?!\S)|(?<!\S)naḥ(?!\S)')
# any whitespace token of 20+ chars = long/compound candidate
LONGTOK = re.compile(r'\S{20,}')


def bundle_text(work: str, target: str) -> str | None:
    p = SVREAD / 'data' / f'{work}.json'
    if not p.is_file():
        return None
    try:
        b = json.loads(p.read_text(encoding='utf-8'))
    except ValueError:
        return None
    rows = b.get('verses') or b.get('chunks') or []
    parts = []
    for r in rows:
        if not isinstance(r, dict):
            continue
        vid = str(r.get('id') or r.get('chunk') or '')
        if vid == target or vid.startswith(target + '-v'):
            t = r.get('sanskrit') or r.get('sa') or ''
            if t:
                parts.append(t)
    return ' '.join(parts) if parts else None


def difficulty(text: str) -> str:
    n = len(text)
    return 'short' if n < 60 else ('medium' if n < 140 else 'long')


def category_candidate(text: str) -> str:
    if NEG.search(text):
        return 'negation-candidate'
    if LONGTOK.search(text):
        return 'long-compound-candidate'
    return 'general-candidate'


def build() -> dict:
    idx = json.loads((SVREAD / 'data' / 'traces' / 'index.json').read_text(encoding='utf-8'))
    by_work: dict = {}
    for e in idx.get('entries', []):
        w, t = e.get('work'), e.get('target')
        if not w or not t or w in HOLD:
            continue
        by_work.setdefault(w, []).append(e)
    picks = []
    works = sorted(by_work)
    i = 0
    while len(picks) < N and i < N * 3:
        w = works[i % len(works)]
        bucket = by_work[w]
        j = i // len(works)
        if j < len(bucket):
            picks.append(bucket[j])
        i += 1
        if all(i // len(works) >= len(by_work[x]) for x in works) and len(picks) < N:
            # second pass: any remaining entries, deterministic order
            for w2 in works:
                for e in by_work[w2]:
                    if e not in picks and len(picks) < N:
                        picks.append(e)
            break
    picks = picks[:N]
    items = []
    for e in sorted(picks, key=lambda x: (x['work'], x['target'])):
        text = bundle_text(e['work'], e['target'])
        if not text:
            continue  # no source text on file: cannot be a translation target
        items.append({
            'id': f"{e['work']}:{e['target']}",
            'work': e['work'],
            'target': e['target'],
            'trace_sha256': e.get('sha256'),
            'text': text,
            'difficulty': difficulty(text),
            'category_candidate': category_candidate(text),
            'category': None,
            'classify': 'pending-human',
            'held_out': True,
        })
    # if text-less picks dropped us short, backfill deterministically
    if len(items) < N:
        seen = {x['id'] for x in items}
        for w in works:
            for e in by_work[w]:
                if len(items) >= N:
                    break
                if f"{e['work']}:{e['target']}" in seen:
                    continue
                text = bundle_text(e['work'], e['target'])
                if not text:
                    continue
                items.append({
                    'id': f"{e['work']}:{e['target']}",
                    'work': e['work'], 'target': e['target'],
                    'trace_sha256': e.get('sha256'), 'text': text,
                    'difficulty': difficulty(text),
                    'category_candidate': category_candidate(text),
                    'category': None, 'classify': 'pending-human',
                    'held_out': True,
                })
    items = items[:N]
    return {
        'format': 'svatantrya.blind-eval/1',
        'count': len(items),
        'held_out_policy': (
            'Machine-selected 2026-11-11, stratified one-per-work from the '
            'trace corpus, Ghaṭakarpara excluded (source hold). These passages '
            'are NEVER used in prompts, tuning, or training. difficulty and '
            'category_candidate are machine signals; category stays null until '
            'a human classifies (compound / terminology / negation / ritual / '
            'verse / ambiguity).'),
        'scoring': 'data/eval/RUBRIC.md — correction effort, never BLEU',
        'items': items,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    doc = build()
    if args.check:
        if not OUT.exists():
            print('emit_eval_set --check: missing trika-blind-50.json', file=sys.stderr)
            return 1
        want = json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
        if OUT.read_text(encoding='utf-8') != want:
            print('emit_eval_set --check: trika-blind-50.json differs', file=sys.stderr)
            return 1
        print(f'emit_eval_set --check: GREEN ({doc["count"]} passages)')
        return 0
    if doc['count'] < N:
        print(f'emit_eval_set: only {doc["count"]} text-backed picks (<{N})',
              file=sys.stderr)
        return 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
                   encoding='utf-8')
    print(f'emit_eval_set: {doc["count"]} held-out passages, '
          f'{len(set(i["work"] for i in doc["items"]))} works')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
