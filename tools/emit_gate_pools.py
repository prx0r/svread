#!/usr/bin/env python3
"""Emit gate item pools for the server-scored gate (W1).

The gate's promise is that no model or user can self-report a pass. The
mechanism: a public deterministic pool (this file's output) plus a server that
samples, shuffles, holds the key, scores, and writes the unlock. Reading the
pool is studying, not cheating; skipping, self-attesting, and replaying are
what the server prevents.

  data/wheels/gates.json
    {format, version, curricula: {word: {stages: {1: {items[]}, ...}}, sentence: {...}},
     rules: {n: 20, pass: 18, mix: "50% current stage + 50% earlier", expiry_s: 600, attempts_per_hour: 3}}

  python3 tools/emit_gate_pools.py
  python3 tools/emit_gate_pools.py --check
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
OUT = SVREAD / 'data' / 'wheels' / 'gates.json'

N_ITEMS = 20
PASS = 18
ENDINGS = [
    ('tral', 'त्र', 'where', '5.3.10'),
    ('dA', 'दा', 'when', '5.3.15'),
    ('tasil', 'तः', 'from where', '5.3.7'),
    ('TAl', 'था', 'how', '5.3.23'),
]
END_DEVA = {a: d for a, d, _, _ in ENDINGS}
BASE_DEVA = {'kim': 'किम्', 'tad': 'तद्', 'yad': 'यद्', 'sarva': 'सर्व', 'anya': 'अन्य', 'eka': 'एक'}


def pick4(correct: str, others: list, seed: int) -> list:
    """Deterministic 4 options containing correct exactly once."""
    seen, dist = [], []
    for o in others[(seed % max(len(others), 1)):]+others[:(seed % max(len(others), 1))]:
        if o != correct and o not in seen:
            seen.append(o)
            dist.append(o)
        if len(dist) == 3:
            break
    opts = [correct] + dist
    rot = seed % 4
    return opts[rot:] + opts[:rot]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    word = json.loads((SVREAD / 'data' / 'wheels' / 'word.json').read_text(encoding='utf-8'))
    sent = json.loads((SVREAD / 'data' / 'wheels' / 'sentence.json').read_text(encoding='utf-8'))

    # ---- word curriculum ----
    bases = word['bases']  # [{slp1,iast,en}]
    endings = word['endings']  # [{attr,...}]
    rows = {r['base']: r for r in word['rows']}

    items = {'1': [], '2': [], '3': [], '4': []}
    for i, b in enumerate(bases):
        others = [BASE_DEVA[x['slp1']] for x in bases]
        items['1'].append({
            'id': f'w1:{b["slp1"]}', 'kind': 'base-meaning',
            'prompt': f'which base means "{b["en"]}"?',
            'options': pick4(BASE_DEVA[b['slp1']], others, i),
            'answer': BASE_DEVA[b['slp1']],
        })
    # + eka: the sixth base lives in the curated tier (not the 5x5 Machine A
    # grid), and Level 1 teaches six bases. Gate item only, no pack change.
    eka_others = [BASE_DEVA[b['slp1']] for b in bases] + ['एक']
    items['1'].append({
        'id': 'w1:eka', 'kind': 'base-meaning',
        'prompt': 'which base means "one"?',
        'options': pick4('एक', eka_others, len(bases)),
        'answer': 'एक',
    })
    end_opts = [END_DEVA[e['attr']] for e in endings]
    for i, e in enumerate(endings):
        items['2'].append({
            'id': f'w2:{e["attr"]}', 'kind': 'ending-function',
            'prompt': f'which ending answers "{e["en"]}" ({e["sutra"]})?',
            'options': pick4(END_DEVA[e['attr']], end_opts, i + 1),
            'answer': END_DEVA[e['attr']],
        })

    def cell_item(base: str, attr: str, n: int) -> dict:
        c = rows[base]['cells'][attr]
        d = c['derived']
        row_en = rows[base]['base_en']
        func_en = next(x['en'] for x in endings if x['attr'] == attr)
        others = []
        for b2, r2 in sorted(rows.items()):
            for a2 in sorted(r2['cells']):
                dv = r2['cells'][a2]['derived']['deva']
                if dv != d['deva']:
                    others.append(dv)
        return {
            'id': f'w:{base}-{attr}', 'kind': 'cell-build',
            'prompt': f'{row_en} + {func_en} → ?',
            'options': pick4(d['deva'], others, n),
            'answer': d['deva'],
        }

    n = 0
    for b in ['kim', 'sarva']:
        for e in ['tral', 'dA', 'tasil', 'TAl']:
            it = cell_item(b, e, n)
            it['id'] = f'w3:{b}-{e}'
            items['3'].append(it)
            n += 1
    for b in sorted(rows):
        for e in ['tral', 'dA', 'tasil', 'TAl']:
            if b in ('kim', 'sarva'):
                continue  # L3 covers all 8 kim/sarva cells; L4 adds the rest, then repeats both
            it = cell_item(b, e, n)
            it['id'] = f'w4:{b}-{e}'
            items['4'].append(it)
            n += 1
    # word-4 must also include the L3 cells (cumulative bank); keep full 20-cell bank
    for b in ['kim', 'sarva']:
        for e in ['tral', 'dA', 'tasil', 'TAl']:
            it = cell_item(b, e, n)
            it['id'] = f'w4:{b}-{e}'
            items['4'].append(it)
            n += 1

    # ---- sentence curriculum ----
    subj = {o['id']: o for o in next(r for r in sent['rings'] if r['id'] == 'subject')['options']}
    sitems = {'1': [], '2': [], '3': []}
    verb_forms = {'aham': 'अस्मि', 'tvam': 'असि', 'mama-mata': 'अस्ति', 'pita': 'अस्ति'}
    subj_order = ['aham', 'tvam', 'mama-mata', 'pita']
    allv = list(dict.fromkeys(verb_forms.values())) + ['सन्ति']
    for i, sid in enumerate(subj_order):
        vs = verb_forms[sid]
        sitems['1'].append({
            'id': f's1:{sid}', 'kind': 'subject-verb',
            'prompt': f'subject "{subj[sid]["label"]}" ({subj[sid]["en"]}) takes which verb?',
            'options': pick4(vs, allv, i),
            'answer': vs,
        })
    ring = {r['id']: r for r in sent['rings']}
    # EN glosses are teaching labels (same as the word wheel rows); the worker
    # verifies forms, never these strings.
    EN = {'kim-tral': 'where?', 'tad-tral': 'there', 'yad-tral': 'where (relative)',
          'sarva-tral': 'everywhere', 'anya-tral': 'elsewhere',
          'kim-da': 'when?', 'tad-da': 'then', 'yad-da': 'when (relative)',
          'sarva-da': 'always', 'anya-da': 'at another time'}
    for i, rid in enumerate(['time', 'place']):
        opts = [o['deva'] for o in ring[rid]['options']]
        for j, o in enumerate(ring[rid]['options']):
            sitems['2'].append({
                'id': f's2:{rid}-{o["id"]}', 'kind': 'adverb-meaning',
                'prompt': f'which form means "{EN.get(o["id"], o["iast"])}"?',
                'options': pick4(o['deva'], opts, i * 7 + j),
                'answer': o['deva'],
            })
    manners = [('kim-katham', 'कथम्', 'how? (special, 5.3.24-25)'),
               ('tad-thal', 'तथा', 'thus'), ('yad-thal', 'यथा', 'as'),
               ('sarva-thal', 'सर्वथा', 'in every way'), ('anya-thal', 'अन्यथा', 'otherwise')]
    owners = [('mama', 'मम', 'my'), ('tava', 'तव', 'your'),
              ('tasya', 'तस्य', 'his'), ('tasyāḥ', 'तस्याः', 'her')]
    mopts = [m[1] for m in manners] + [o[1] for o in owners]
    for i, (eid, dv, en) in enumerate(manners + owners):
        sitems['3'].append({
            'id': f's3:{eid}', 'kind': 'special-or-possessor',
            'prompt': f'which form means "{en}"?',
            'options': pick4(dv, mopts, i * 3 + 1),
            'answer': dv,
        })

    doc = {
        'format': 'svatantrya.gate-pools/1',
        'rules': {'n': N_ITEMS, 'pass': PASS,
                  'mix': 'half current stage, half earlier stages (cumulative); server samples, shuffles, holds the key',
                  'session_expiry_s': 600, 'attempts_per_hour': 3,
                  'unlock': 'stage written by the server only; replay cannot raise a score',
                  'signed_out': 'local scoring is labelled unverified and never unlocks'},
        'curricula': {
            'word': {'title': 'Machine A: the word constructor',
                     'stages': {str(k): {'items': v} for k, v in items.items()}},
            'sentence': {'title': 'Machine B: the sentence constructor',
                         'stages': {str(k): {'items': v} for k, v in sitems.items()}},
        },
        'note': ('Public item bank. Reading it is studying, not cheating. The gate is '
                 'enforced by the server: sampling, time limit, replay protection, receipts.'),
    }

    if args.check:
        if not OUT.exists():
            print('emit_gate_pools --check: missing data/wheels/gates.json', file=sys.stderr)
            return 1
        want = json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
        if OUT.read_text(encoding='utf-8') != want:
            print('emit_gate_pools --check: gates.json differs', file=sys.stderr)
            return 1
        print('emit gate pools --check: GREEN')
        return 0
    OUT.write_text(json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n', encoding='utf-8')
    counts = {c: {s: len(v['items']) for s, v in doc['curricula'][c]['stages'].items()} for c in ('word', 'sentence')}
    print(f'emit_gate_pools: {counts}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
