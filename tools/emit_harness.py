#!/usr/bin/env python3
"""Emit data/wheels/harness.json — the one-fetch Sanskrit learning harness.

A tutor model fetches this single file and gets: the whole program (all four
wheel datasets embedded), the display protocol, the decision tree (levels +
journey gates), the fast verification path (pack index + crosscheck flags),
pronunciation pointer, translation-work links, and trika-x links.

Full prakriya traces stay in data/grammar/wheel-pack.json (large); the pack
index here carries surfaces + status + machine rules so most answers verify
without a second fetch. Deterministic; --check compares bytes.

Usage:
  python3 tools/emit_harness.py
  python3 tools/emit_harness.py --check
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
GRAMMAR = SVREAD / 'data' / 'wheels' / '..' / 'grammar'
WHEELS = SVREAD / 'data' / 'wheels'

ORIGIN = 'https://svatantrya.net'

TUTOR = [
    ('level-01-bases.md', 'Level 1 — Bases', 'six question-words, no endings'),
    ('level-02-endings.md', 'Level 2 — Endings', '20 cells + traces + crosscheck'),
    ('level-03-subject-verb.md', 'Level 3 — Who does what', 'agreement'),
    ('level-04-time-place.md', 'Level 4 — When and where', 'adverbs join, never inflect'),
    ('level-05-questions.md', 'Level 5 — Asking', 'gated modes + possessors'),
    ('level-06-karaka.md', 'Level 6 — Relationships', 'six karakas, verb at hub'),
]


def load(name: str) -> dict:
    return json.loads((WHEELS / name).read_text(encoding='utf-8'))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    word = load('word.json')
    sentence = load('sentence.json')
    trika = load('trika.json')
    karaka = load('karaka.json')
    pack = json.loads((GRAMMAR / 'wheel-pack.json').read_text(encoding='utf-8'))
    links_doc = json.loads((GRAMMAR / 'wheel-links.json').read_text(encoding='utf-8'))
    links = links_doc.get('links', {})
    cc = json.loads((GRAMMAR / 'crosscheck.json').read_text(encoding='utf-8'))

    by_id = {e['id']: e for e in pack.get('entries', [])}

    def surf(eid: str) -> dict:
        e = by_id.get(eid)
        if e is None:
            raise ValueError(f'harness references unknown pack id {eid}')
        if e.get('status') not in ('DERIVED', 'CURATED'):
            raise ValueError(f'harness references non-ready pack id {eid}')
        lk = links.get(eid, {})
        return {'id': eid, 'iast': e.get('iast', ''), 'deva': e.get('deva', ''),
                'status': e.get('status', ''),
                'all_surfaces': [{'iast': s['iast'], 'deva': s['deva']}
                                 for s in (e.get('all_surfaces') or [])],
                'machine_rules': e.get('machine_rules', []),
                'lessons': (lk.get('lessons') or [])[:4],
                'verses': [{'work': r['work'], 'verse': r['verse']}
                           for r in (lk.get('verses') or [])[:4]]}

    # every wheel option must resolve to ready pack data or a curated note
    need_ids = set()
    for r in word['rows']:
        for c in r['cells'].values():
            need_ids.add(c['derived']['id'])
            if c.get('special') and c['special'] in word.get('specials', {}):
                need_ids.add(word['specials'][c['special']]['id'])
    for ring in sentence['rings']:
        for o in ring['options']:
            if ring['id'] == 'subject':
                need_ids.add(o['verb_surface']['id'])
                need_ids.add(o['adj_surface']['id'])
            elif isinstance(o, dict):
                need_ids.add(o['id'])
    pack_index = {eid: surf(eid) for eid in sorted(need_ids)}

    cc_rows = {r['id']: r for r in cc.get('rows', [])}
    disagreements = [{'id': r['id'], 'curated': r['deva_curated'],
                      'machine': r['machine_surfaces'], 'note': r['note']}
                     for r in cc.get('rows', []) if r.get('agree') is False]
    gaps = [{'id': r['id'], 'curated': r['deva_curated'], 'note': r['note']}
            for r in cc.get('rows', []) if r.get('agree') is None]

    doc = {
        'format': 'svatantrya.wheel-harness/1',
        'origin': ORIGIN,
        'harness_prompt': f'{ORIGIN}/data/wheels/HARNESS.md',
        'display': {
            'page': f'{ORIGIN}/wheels.html',
            'anchors': {
                'journey': f'{ORIGIN}/wheels.html#journey',
                'levels': {f'level-{n}': f'{ORIGIN}/wheels.html#level-{n}' for n in range(1, 7)},
            },
            'protocol': ('You cannot render the discs. The page is the display: '
                         'send the learner a deep link (level anchor or #journey), name the exact '
                         'ring positions to set, and narrate what changed. Describe every state '
                         'in words (deva + iast + English) so voice-only works.'),
        },
        'wheels': {'word': word, 'sentence': sentence, 'karaka': karaka, 'trika': trika},
        'verify': {
            'rule': 'Never state a form from memory. Look it up here first.',
            'fast_path': [
                '1. pack_index below: exact deva or iast match?',
                '2. crosscheck flags: agree (machine-confirmed), disagree (teach curated, name the special), gap (machine cannot derive — say so).',
                '3. Need the full derivation? data/grammar/wheel-pack.json entry -> prakriya[].sutra + sutra_iast.',
                '4. Need it in real text? entry.verses[] -> reader ?work=<work> (+ verse anchor); entry.lessons[] -> lesson ids.',
            ],
            'pack_format': pack.get('format'),
            'generator': pack.get('generator', {}).get('name', '') + ' ' + str(pack.get('generator', {}).get('version', '')),
            'pack_index': pack_index,
            'crosscheck_summary': cc.get('summary', {}),
            'disagreements': disagreements,
            'gaps': gaps,
        },
        'pronunciation': {
            'guide': f'{ORIGIN}/data/wheels/HARNESS.md#pronunciation',
            'note': ('IAST in every entry is the pronunciation key; the guide gives '
                     'the reading rules (vowels, consonants, visarga, stress, slow '
                     'syllable-by-syllable breakdown). Verse audio exists for reader '
                     'passages, not isolated forms — say forms slowly instead.'),
        },
        'translation_work': {
            'reader': f'{ORIGIN}/?work=<work>',
            'bundles': f'{ORIGIN}/data/<work>.json (sa/l1/l2/l3/l4/c1/argmap/gate per verse)',
            'word_gloss': f'{ORIGIN}/data/l0/<work>.json (per-token gloss + status)',
            'lessons': f'{ORIGIN}/?view=sanskrit (10 lessons + rule boxes)',
            'claims': f'{ORIGIN}/claim/<work>/<target>/ (answer-first, hashes, verify steps)',
            'traces': f'{ORIGIN}/data/traces/<work>-<target>.json',
        },
        'trika': {
            'note': ('Trika wheels cite translation-work lore/concepts files where they '
                     'exist (LINKED) or carry owner glosses marked PENDING. Bring up: '
                     'wheel option -> concept term -> C1 essence in the reader bundle -> '
                     'claim page for proof. Guided meditations: drafts only, owner-gated, '
                     'never auto-published (see HARNESS.md).'),
            'formal': f'{ORIGIN}/data/formal.json',
            'essays': f'{ORIGIN}/data/scholar/<work>.json (published versions + signoffs)',
        },
        'decision_tree': {
            'entry': 'Start every learner at Level 1. Never skip: each level feeds the next.',
            'stages': [
                {'level': 1, 'name': 'Bases', 'needs': [],
                 'items_from': 'wheels.word.bases',
                 'quiz': 'EN meaning -> deva form, 4 options', 'pass': '90% over 10+ tries',
                 'on_pass': 'open Level 2', 'on_fail': 're-drill, mix all six bases'},
                {'level': 2, 'name': 'Endings', 'needs': [1],
                 'items_from': 'wheels.word.rows (20 cells) + verify.disagreements + verify.gaps',
                 'quiz': 'base+function -> form; name the special (katham) and the gaps',
                 'pass': '90% over 10+', 'on_pass': 'open Level 3',
                 'on_fail': 're-drill with Level 1 mixed in (cumulative)'},
                {'level': 3, 'name': 'Who does what', 'needs': [1, 2],
                 'items_from': 'wheels.sentence.rings[subject]',
                 'quiz': 'subject -> verb + adjective (both must move)',
                 'pass': '90% over 10+', 'on_pass': 'open Level 4',
                 'on_fail': 're-drill; feminine agreement is the usual miss'},
                {'level': 4, 'name': 'When and where', 'needs': [3],
                 'items_from': 'wheels.sentence.rings[time,place] + entry.verses[]',
                 'quiz': 'build full sentence; open one linked verse per form',
                 'pass': '90% over 10+', 'on_pass': 'open Level 5',
                 'on_fail': 're-drill; adverbs never inflect is the point'},
                {'level': 5, 'name': 'Asking', 'needs': [4],
                 'items_from': 'vendor curated modes/owners/predicates + verify.crosscheck',
                 'quiz': '10-turn conversation script; respect the source gate (from where? needs come)',
                 'pass': 'two clean 10-turn conversations',
                 'on_pass': 'open Level 6', 'on_fail': 're-drill; gate violations reset the run'},
                {'level': 6, 'name': 'Karaka', 'needs': [5],
                 'items_from': 'wheels.karaka',
                 'quiz': 'sentence -> verb, then each noun: karaka, then vibhakti, in that order',
                 'pass': '10 clean parses', 'on_pass': 'declensions next (Topics IX-X)',
                 'on_fail': 'relationship before ending, always'},
            ],
            'journey_gates': ('On-site journey mirrors these stages: each layer unlocks at 90% '
                              'over 10+ tries, every layer re-drills earlier ones, sentence circle '
                              'locked until the word circle completes.'),
        },
        'tutor': [{'file': f, 'title': t, 'url': f'{ORIGIN}/data/wheels/tutor/{f}', 'covers': d}
                  for f, t, d in TUTOR],
        'warning': ('One fetch carries the program. Curated teaching forms and machine '
                    'traces are labeled per entry; disagreements and gaps are data, never '
                    'silent overrides. Nothing here is doctrine.'),
    }

    out = WHEELS / 'harness.json'
    if args.check:
        if not out.exists():
            print('emit_harness --check: missing harness.json', file=sys.stderr)
            return 1
        want = json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
        if out.read_text(encoding='utf-8') != want:
            print('emit_harness --check: harness.json differs', file=sys.stderr)
            return 1
        return 0
    out.write_text(json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
                   encoding='utf-8')
    print(f'emit_harness: harness.json ({out.stat().st_size} bytes, '
          f'{len(pack_index)} pack entries, {len(disagreements)} specials, {len(gaps)} gaps)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
