#!/usr/bin/env python3
"""Vendor the deitybody Mātṛkā curriculum into svread (practice tab data).

Source of truth stays in /root/deitybody (lane-owned, read-only here):
  data/curriculum.json          10 gated stages
  practice/CURRICULUM_CARDS.md   DO / IN THE MIND / NOT / SOURCE per stage

Output (hash-pinned by release_manifest):
  data/practice/curriculum.json  verbatim curriculum + source sha256
  data/practice/cards.json       parsed cards + source sha256

Fresh-checkout contract: when the deitybody checkout is unreadable, keep the
vendored bytes byte-for-byte (same pattern as the pushing digest). Nothing is
paraphrased; the cards parser only splits fields, never rewrites text.

  python3 tools/emit_practice.py
  python3 tools/emit_practice.py --check
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
UP = Path(os.environ.get('DEITYBODY_ROOT', '/root/deitybody'))
OUT = SVREAD / 'data' / 'practice'

def _readable(p: Path) -> bool:
    try:
        return p.is_file()
    except OSError:
        return False

def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def parse_cards(md: str) -> list:
    """Split CURRICULUM_CARDS.md into per-stage field dicts. Text preserved."""
    cards = []
    sections = re.split(r'^## ', md, flags=re.M)[1:]
    for sec in sections:
        lines = sec.split('\n')
        header = lines[0].strip()
        m = re.match(r'^(\d+)\s*[·.]\s*(.+)$', header)
        if not m:
            continue
        n, title = int(m.group(1)), m.group(2).strip()
        fields = {}
        cur_key = None
        for line in lines[1:]:
            bm = re.match(r'^-\s*\*\*(.+?):\*\*\s*(.*)$', line)
            if bm:
                cur_key = bm.group(1).strip()
                fields[cur_key] = bm.group(2).strip()
            elif cur_key and line.startswith('  ') and line.strip():
                fields[cur_key] += ' ' + line.strip()
            elif line.startswith('- ') and not bm:
                # continuation bullet under the current field
                if cur_key:
                    fields[cur_key] += ' ' + line[2:].strip()
        cards.append({'n': n, 'title': title, 'fields': fields})
    return cards

def build() -> dict | None:
    cur_p = UP / 'data' / 'curriculum.json'
    cards_p = UP / 'practice' / 'CURRICULUM_CARDS.md'
    if not (_readable(cur_p) and _readable(cards_p)):
        # fresh checkout: vendored bytes must already exist
        for name in ('curriculum.json', 'cards.json'):
            if not _readable(OUT / name):
                return None
        return 'vendored'
    cur_bytes = cur_p.read_bytes()
    card_bytes = cards_p.read_bytes()
    curriculum = json.loads(cur_bytes.decode('utf-8'))
    cards = parse_cards(card_bytes.decode('utf-8'))
    return {
        'curriculum': {
            'format': 'svatantrya.practice-curriculum/1',
            'source': {'repo': 'prx0r/deitybody', 'path': 'data/curriculum.json',
                       'sha256': sha256(cur_bytes)},
            'rule_verbatim': curriculum.get('rule', ''),
            'curriculum': curriculum,
        },
        'cards': {
            'format': 'svatantrya.practice-cards/1',
            'source': {'repo': 'prx0r/deitybody', 'path': 'practice/CURRICULUM_CARDS.md',
                       'sha256': sha256(card_bytes)},
            'count': len(cards),
            'cards': cards,
        },
    }

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    built = build()
    if built is None:
        print('emit_practice: no deitybody checkout and no vendored copy', file=sys.stderr)
        return 1
    if built == 'vendored':
        # verify the vendored files are self-consistent
        cur = json.loads((OUT / 'curriculum.json').read_text(encoding='utf-8'))
        cards = json.loads((OUT / 'cards.json').read_text(encoding='utf-8'))
        n_cur = len(cur['curriculum'].get('stages', []))
        n_cards = cards.get('count', 0)
        if n_cur != 10 or n_cards != 10:
            print(f'emit_practice: vendored inconsistent ({n_cur} stages, {n_cards} cards)',
                  file=sys.stderr)
            return 1
        if args.check:
            print('emit_practice --check: GREEN (vendored fallback, no upstream)')
        else:
            print('emit_practice: using vendored copy (upstream absent)')
        return 0
    files = {k + '.json': json.dumps(v, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
             for k, v in built.items()}
    if args.check:
        ok = True
        for name, want in files.items():
            p = OUT / name
            if not p.exists() or p.read_text(encoding='utf-8') != want:
                print(f'emit_practice --check: {name} differs', file=sys.stderr)
                ok = False
        if ok:
            print('emit_practice --check: GREEN')
        return 0 if ok else 1
    OUT.mkdir(parents=True, exist_ok=True)
    for name, want in files.items():
        (OUT / name).write_text(want, encoding='utf-8')
    n = built['cards']['count']
    print(f'emit_practice: curriculum ({len(built["curriculum"]["curriculum"]["stages"])} stages) '
          f'+ cards ({n}) vendored with source sha256')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
